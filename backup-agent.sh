#!/bin/sh
# Continuous backup agent for the Bark wallet on StartOS.
#
# Watches the live wallet database for any change, takes a consistent SQLite
# snapshot (VACUUM INTO), and uploads it through per-target rclone `crypt`
# remotes — encrypted with a key derived from the wallet mnemonic before it
# leaves the box. An on-box "local" target ALWAYS runs (a safety floor bundled
# in the native StartOS backup); the user's external targets ($CONFIG) provide
# true off-box recoverability. See README.md "Backups and Restore".
#
# Modes:
#   (default)   long-running watcher daemon (run by the backup-agent daemon)
#   --once      take one backup now and exit (used by the "Back Up Now" action)
#   --restore   if a restore is pending, pull+decrypt the latest snapshot into
#               db.sqlite, then exit (run as the restore-pull oneshot)
#
# Paths below MUST match startos/utils.ts.
set -u
umask 077

WALLET_DIR=/data/.bark
DB="$WALLET_DIR/db.sqlite"
MNEMONIC="$WALLET_DIR/mnemonic"
CONFIG=/data/backup-config.json
FLAGS=/data/startupFlags.json
STATE="$WALLET_DIR/.backup-state.json"
# Freshness high-water-mark: the generation of the last snapshot we shipped.
# Lives on /data (NOT excluded from the native StartOS backup) so it travels
# with the wallet pointer and gives restore an independent "newest known"
# witness to detect a rolled-back target. See do_restore / README.
WATERMARK=/data/backup-watermark.json
# Always-on on-box backup. It rides inside the native StartOS backup (a safety
# floor); external targets in $CONFIG provide true off-box recoverability.
LOCAL_REMOTE="local:/data/local-backups"

WORK=/tmp/bark-backup
SNAP="$WORK/snap.sqlite"
RCONF="$WORK/rclone.conf"
KNOWN_HOSTS="$WORK/known_hosts"
ENC_NAME=wallet.db         # logical object name inside each crypt remote
META_NAME=wallet.meta      # per-target freshness marker (encrypted alongside)
# Each snapshot carries its own generation in this table, so a marker swapped
# onto an older snapshot cannot pass it off as current. Dropped on restore.
GEN_TABLE=startos_backup_gen
WALLET_ID=''               # this wallet's folder on every external target

BACKSTOP=300        # seconds; unconditional snapshot cadence (catches silent
                    # on-chain mutations and inotify gaps)
DEBOUNCE=3          # seconds; let a burst of writes settle before snapshotting
RCLONE_FLAGS="--contimeout=15s --timeout=120s --retries=2 --low-level-retries=2"

log() { echo "[backup-agent] $*" >&2; }

# ---- state helpers (atomic merge into STATE) -------------------------------
# All jq args are forwarded; the current state (or {}) is the input document.
state_merge() {
  mkdir -p "$WORK"
  _tmp="$WORK/.state.$$"
  _cur='{}'
  [ -s "$STATE" ] && _cur=$(cat "$STATE" 2>/dev/null)
  [ -n "$_cur" ] || _cur='{}'
  printf '%s' "$_cur" | jq "$@" > "$_tmp" 2>/dev/null && mv "$_tmp" "$STATE" || rm -f "$_tmp"
}
state_set_str() { state_merge --arg v "$2" ". + {\"$1\": \$v}"; }
state_set_num() { state_merge --argjson v "$2" ". + {\"$1\": \$v}"; }
state_clear()   { state_merge "del(.$1)"; }
state_get() { jq -r ".$1 // empty" "$STATE" 2>/dev/null || true; }

cfg() { jq -r "$1" "$CONFIG" 2>/dev/null; }
# Each ENABLED external target's provider name; a folder path may hold spaces,
# so loops iterate these names and read the path with target_path.
externals() {
  for _p in gdrive dropbox nextcloud sftp; do
    [ "$(cfg ".$_p.enabled // false")" = true ] && echo "$_p"
  done
}
target_path() {
  _pp=$(cfg ".$1.path // empty"); [ -n "$_pp" ] || _pp=bark-backups
  printf '%s' "$_pp"
}
# "target:crypt section" for every copy restore may read: each external
# target's own folder and its folder root.
restore_sources() {
  printf 'local:local_enc\n'
  for _name in $(externals); do
    printf '%s:%s_enc\n%s:%s_legacy\n' "$_name" "$_name" "$_name" "$_name"
  done
}
# rclone exits 3 or 4 when nothing is at the path; any other failure means the
# target could not be consulted, which is not evidence it holds no copy.
missing_rc() { [ "$1" -eq 3 ] || [ "$1" -eq 4 ]; }
# Prints 0 and fails for a missing or invalid marker.
marker_gen() {
  _marker=$(numor0 "$(jq -r '.gen // 0' "$1" 2>/dev/null || echo 0)")
  printf '%s\n' "$_marker"
  [ "$_marker" -gt 0 ]
}
# rclone crypt's errors for a payload this key cannot decrypt.
crypt_payload_invalid() {
  printf '%s\n' "$1" | tail -n 1 | grep -Fq \
    -e 'file is too short to be encrypted' \
    -e 'file has truncated block header' \
    -e 'not an encrypted file - bad magic string' \
    -e 'failed to authenticate decrypted block - bad password?'
}
failure_reason() {
  if printf '%s' "$1" | grep -Eq 'invalid_grant|Reason: authError'; then
    echo signin
  elif printf '%s' "$1" | grep -q 'knownhosts: key'; then
    echo hostkey
  else
    printf '%s' "$1" | tail -n 2 | tr '\n' ' ' | sed 's/  */ /g; s/^ *//; s/ *$//'
  fi
}
# A target the user marked as trusting a self-signed cert (LAN Nextcloud, etc.).
# The snapshot stays encrypted, but anyone in between can read the app password.
# Echoes the rclone flag to add, or nothing.
tls_flag() { [ "$(cfg ".$1.insecureTls // false")" = true ] && printf '%s' '--no-check-certificate'; }

# ---- key derivation --------------------------------------------------------
# Deterministic crypt passwords from the wallet mnemonic. Both encrypt and
# decrypt go through here, so the exact byte handling only needs to be
# self-consistent (the same script does both).
derive() { # context -> base64 key
  printf '%s' "$(cat "$MNEMONIC")" | openssl dgst -sha256 -hmac "$1" -binary | base64 | tr -d '\n'
}

# An HMAC of the mnemonic names the wallet's folder on every external target,
# so wallets sharing an account never overwrite each other and the name tells
# the target nothing.
wallet_id() {
  [ -n "$WALLET_ID" ] && return 0
  _id=$(printf '%s' "$(cat "$MNEMONIC")" | openssl dgst -sha256 -hmac bark-backup-id-v1 -binary | od -An -tx1 | tr -d ' \n') || return 1
  printf '%s' "$_id" | grep -Eq '^[0-9a-f]{64}$' || return 1
  WALLET_ID=$_id
}

crypt_section() { # section name, underlying remote
  cat >> "$RCONF" <<EOF

[$1]
type = crypt
remote = $2
password = $_pw
password2 = $_pw2
filename_encryption = off
directory_name_encryption = false
EOF
}

# Build an effective rclone.conf from the STRUCTURED config: one section per
# enabled target, plus one crypt wrapper per target (<name>_enc). rclone does
# encrypt+upload / download+decrypt in one step, so we never handle ciphertext
# filenames ourselves. Target passwords are stored PLAINTEXT in the config and
# obscured HERE with `rclone obscure` — the only format rclone accepts — so the
# TS side never round-trips through an obscure/reveal heuristic.
build_conf() {
  mkdir -p "$WORK"
  wallet_id || return 1
  # Always-on local backend (no credentials).
  printf '[local]\ntype = local\n' > "$RCONF"
  if [ "$(cfg '.gdrive.enabled // false')" = true ]; then
    printf '\n[gdrive]\ntype = drive\nscope = drive\nclient_id = %s\nclient_secret = %s\ntoken = %s\n' \
      "$(cfg '.gdrive.clientId // empty')" "$(cfg '.gdrive.clientSecret // empty')" "$(cfg '.gdrive.token // empty')" >> "$RCONF"
  fi
  if [ "$(cfg '.dropbox.enabled // false')" = true ]; then
    printf '\n[dropbox]\ntype = dropbox\nclient_id = %s\nclient_secret = %s\ntoken = %s\n' \
      "$(cfg '.dropbox.clientId // empty')" "$(cfg '.dropbox.clientSecret // empty')" "$(cfg '.dropbox.token // empty')" >> "$RCONF"
  fi
  if [ "$(cfg '.nextcloud.enabled // false')" = true ]; then
    printf '\n[nextcloud]\ntype = webdav\nurl = %s\nvendor = nextcloud\nuser = %s\npass = %s\n' \
      "$(cfg '.nextcloud.url // empty')" "$(cfg '.nextcloud.user // empty')" "$(rclone obscure "$(cfg '.nextcloud.pass // empty')")" >> "$RCONF"
  fi
  if [ "$(cfg '.sftp.enabled // false')" = true ]; then
    pin_sftp_host_key
    cfg '.sftp.knownHosts // empty' > "$KNOWN_HOSTS"
    {
      printf '\n[sftp]\ntype = sftp\nhost = %s\nuser = %s\nkey_use_agent = false\nport = %s\nset_modtime = false\nknown_hosts_file = %s\n' \
        "$(cfg '.sftp.host // empty')" "$(cfg '.sftp.user // empty')" "$(cfg '.sftp.port // "22"')" "$KNOWN_HOSTS"
      if [ "$(cfg '.sftp.authType // "password"')" = key ]; then
        # key_pem is stored rclone-ready: one line with literal \n separators.
        printf 'key_pem = %s\n' "$(cfg '.sftp.keyPem // empty')"
      else
        _sp=$(cfg '.sftp.pass // empty')
        [ -n "$_sp" ] && printf 'pass = %s\n' "$(rclone obscure "$_sp")"
      fi
    } >> "$RCONF"
  fi
  _pw=$(rclone obscure "$(derive bark-backup-crypt-v1)")
  _pw2=$(rclone obscure "$(derive bark-backup-salt-v1)")
  crypt_section local_enc "$LOCAL_REMOTE"
  # <name>_legacy is the root copies landed in before wallets had a folder.
  for _name in $(externals); do
    _path=$(target_path "$_name")
    crypt_section "${_name}_enc" "${_name}:${_path}/${WALLET_ID}"
    crypt_section "${_name}_legacy" "${_name}:${_path}"
  done
}

# A target saved before host keys were recorded has none: pin whatever key the
# server presents now, so every later connection is held to it. An empty
# known_hosts file makes rclone refuse every key, so a failed scan fails closed.
pin_sftp_host_key() {
  [ -z "$(cfg '.sftp.knownHosts // empty')" ] || return 0
  _keys=$(ssh-keyscan -T 10 -p "$(cfg '.sftp.port // "22"')" "$(cfg '.sftp.host // empty')" 2>/dev/null | grep -v '^#')
  [ -n "$_keys" ] || return 0
  jq --arg k "$_keys" '.sftp.knownHosts = $k' "$CONFIG" > "$CONFIG.tmp" && mv "$CONFIG.tmp" "$CONFIG" || rm -f "$CONFIG.tmp"
  log "[sftp] pinned the server's host key"
}

snapshot() {
  mkdir -p "$WORK"
  rm -f "$SNAP"
  # .timeout waits out an in-flight barkd write rather than erroring SQLITE_BUSY.
  sqlite3 "$DB" ".timeout 10000" "VACUUM INTO '$SNAP'" 2>/dev/null || return 1
  [ -s "$SNAP" ] || return 1
}

# Classify a database file: "wallet" (sound SQLite with the properties row
# barkd's open_wallet reads), "empty" (missing, zero bytes, or sound with no
# such row) or "unsound". A zero-byte file passes PRAGMA integrity_check, and
# barkd's failed open of a missing database leaves a bare schema, so neither
# check alone tells a wallet apart from nothing.
wallet_state() {
  [ -s "$1" ] || { echo empty; return 0; }
  sqlite3 "$1" "PRAGMA integrity_check" 2>/dev/null | grep -qi '^ok$' || { echo unsound; return 0; }
  _rows=$(sqlite3 "$1" "SELECT count(*) FROM bark_properties" 2>/dev/null)
  case "$_rows" in '' | *[!0-9]* | 0) echo empty ;; *) echo wallet ;; esac
}

# Crude guard: the configure action already rejects .onion targets, so this is
# only belt-and-suspenders against a hand-edited config.
remote_is_onion() {
  awk -v s="[$1]" 'BEGIN{f=0} $0==s{f=1;next} /^\[/{f=0} f && tolower($0) ~ /\.onion/{print "1"; exit}' "$RCONF" 2>/dev/null | grep -q 1
}

# Encrypt + upload the snapshot to every target (always-on local + externals).
# Returns 0 only if ALL targets succeeded, so a failing external surfaces as an
# error and gets retried (local on its own basically always succeeds). Records
# each target's failure reason to $WORK/failures ("<name>: <reason>") so the
# caller can build one specific status line instead of a generic "one or more
# failed"; per-cycle chatter is intentionally NOT logged here (do_backup logs a
# de-duplicated summary), or a failing target would flood the log every retry.
ship() {
  _all_ok=0
  : > "$WORK/failures"
  for _name in local $(externals); do
    if remote_is_onion "$_name"; then
      printf '%s: .onion targets are not supported in this version\n' "$_name" >> "$WORK/failures"
      _all_ok=1
      continue
    fi
    _extra=$(tls_flag "$_name")
    # shellcheck disable=SC2086
    _out=$(rclone --config "$RCONF" copyto "$SNAP" "${_name}_enc:$ENC_NAME" $RCLONE_FLAGS $_extra --log-level NOTICE 2>&1)
    if [ $? -eq 0 ]; then
      # Ship the freshness marker (encrypted) next to the snapshot. Used by
      # restore to pick the newest target and detect a rolled-back one.
      # shellcheck disable=SC2086
      rclone --config "$RCONF" copyto "$WORK/wallet.meta" "${_name}_enc:$META_NAME" $RCLONE_FLAGS $_extra 2>/dev/null \
        || log "[$_name] snapshot shipped but freshness marker failed"
    else
      printf '%s: %s\n' "$_name" "$(failure_reason "$_out")" >> "$WORK/failures"
      _all_ok=1
    fi
  done
  return $_all_ok
}

# One backup cycle. Pass "force" to bypass the unchanged-hash skip.
do_backup() (
  # The watcher and Back Up Now share this lock across subcontainers.
  flock -x 9 || { log "backup lock failed"; return 1; }
  [ -f "$DB" ] || { log "no db.sqlite yet (wallet not created)"; return 0; }
  [ -f "$MNEMONIC" ] || { log "no mnemonic; cannot derive backup key"; return 0; }
  if ! snapshot; then log "snapshot failed"; state_set_str lastError "snapshot failed"; return 1; fi
  # The prefix changes whenever the snapshot format does, so the first cycle
  # after an upgrade reships every copy in the new format.
  _hash="v2:$(sha256sum "$SNAP" | awk '{print $1}')"
  if [ "$1" != "force" ] && [ "$_hash" = "$(state_get lastHash)" ]; then
    # Unchanged since the last successful backup — skip silently (barkd touches
    # the DB periodically, so this is the common case; logging it spams).
    rm -f "$SNAP"
    return 0
  fi
  # Never replace the targets' copies with a database that holds no wallet —
  # e.g. the bare schema barkd leaves when a restore found nothing to load.
  if [ "$(wallet_state "$SNAP")" != wallet ]; then
    rm -f "$SNAP"
    log "db.sqlite holds no wallet; not overwriting the backups with it"
    state_set_str lastError "The wallet database holds no wallet, so it was not backed up over the existing copies."
    return 1
  fi
  build_conf || {
    rm -f "$SNAP"
    log "wallet identity could not be derived"
    state_set_str lastError "wallet identity could not be derived"
    return 1
  }
  # Generation = ship time. "Freshest = max gen" lets restore pick the newest
  # target and detect a rolled-back one (target gen < watermark).
  _gen=$(date +%s)
  if ! sqlite3 "$SNAP" "CREATE TABLE $GEN_TABLE(gen INTEGER NOT NULL); INSERT INTO $GEN_TABLE VALUES($_gen);" 2>/dev/null; then
    rm -f "$SNAP"; log "snapshot could not be stamped"; state_set_str lastError "snapshot failed"; return 1
  fi
  printf '{"gen":%s}\n' "$_gen" > "$WORK/wallet.meta"
  _prev_success=$(state_get lastSuccess)
  _prev_error=$(state_get lastError)
  if ship; then
    state_set_num lastSuccess "$_gen"
    state_set_str lastHash "$_hash"
    state_clear lastError
    # v2: every copy at or above this generation carries $GEN_TABLE.
    printf '{"gen":%s,"v":2}\n' "$_gen" > "$WATERMARK"
    # Log on --once, first success, or recovery from failure only — not every
    # cycle barkd touches the DB, which would flood the log.
    if [ "$1" = force ] || [ -n "$_prev_error" ] || [ -z "$_prev_success" ]; then
      log "backup complete (gen=$_gen) — all targets ok"
    fi
  else
    # One specific line naming each failing target and why (surfaced verbatim by
    # the backup-status health check). A failing target isn't retired from
    # lastHash, so it retries every cycle — de-dup the log so an unchanged
    # failure is written once, not on every retry.
    _err=$(awk 'NR>1{printf "; "}{printf "%s",$0}' "$WORK/failures" 2>/dev/null)
    [ -n "$_err" ] || _err='one or more backup targets failed'
    if [ "$1" = force ] || [ "$_err" != "$_prev_error" ]; then
      log "backup targets failing — $_err"
    fi
    state_set_str lastError "$_err"
  fi
  rm -f "$SNAP"
) 9>/data/backup-agent.lock

clear_flag() { echo '{"pendingRestore":false}' > "$FLAGS"; }

# Numeric or 0.
numor0() { case "$1" in '' | *[!0-9]*) echo 0 ;; *) echo "$1" ;; esac; }

# ---- restore: pull the FRESHEST snapshot before barkd starts ---------------
# Pulls each target's freshness marker, seeds from the newest, and REFUSES to
# seed a stale one — if even the newest target is older than our last-known
# generation (the watermark, restored from the native backup), the target has
# been rolled back; loading it would revert the wallet and lose funds.
do_restore() {
  if [ "$(jq -r '.pendingRestore // false' "$FLAGS" 2>/dev/null || echo false)" != "true" ]; then
    log "no pending restore"; exit 0
  fi
  # Never clobber a wallet that already exists (e.g. user created one after a
  # prior refusal, or a previous restore already seeded it), nor a database we
  # cannot read. One with no wallet in it is what barkd leaves when it starts
  # before a restore succeeds (it creates the schema, then exits on the missing
  # properties row): discard it, or the pending restore would never retry.
  case "$(wallet_state "$DB")" in
    wallet) log "db.sqlite already holds a wallet; leaving it untouched"; clear_flag; exit 0 ;;
    unsound) log "db.sqlite already present; leaving it untouched"; clear_flag; exit 0 ;;
  esac
  if [ -e "$DB" ]; then
    log "discarding db.sqlite: it holds no wallet"
    rm -f "$DB" "$DB-wal" "$DB-shm" "$DB-journal"
  fi
  log "restore pending: locating the freshest wallet snapshot"
  if [ ! -f "$MNEMONIC" ]; then log "no mnemonic restored; starting fresh"; clear_flag; exit 0; fi
  build_conf || { log "wallet identity could not be derived (will retry next start)"; exit 0; }
  _floor=$(marker_gen "$WATERMARK")
  _stamped=$(numor0 "$(jq -r '.v // 1' "$WATERMARK" 2>/dev/null || echo 1)")

  # Collect "<gen> <target> <section>" for every copy, and every target that
  # could not be consulted: its copy may be the newest, so any other would be
  # a guess that can load an older wallet and then overwrite the newer one.
  : > "$WORK/gens"
  : > "$WORK/unreachable"
  _hostkey=0
  for _src in $(restore_sources); do
    _name=${_src%%:*}
    _section=${_src#*:}
    _label=$_name
    [ "${_section%_legacy}" = "$_section" ] || _label="$_name root"
    remote_is_onion "$_name" && { log "[$_label] skipped (.onion unsupported)"; continue; }
    rm -f "$WORK/m.json"
    _extra=$(tls_flag "$_name")
    # shellcheck disable=SC2086
    _out=$(rclone --config "$RCONF" copyto "${_section}:$META_NAME" "$WORK/m.json" $RCLONE_FLAGS $_extra 2>&1)
    _rc=$?
    if [ "$_rc" -eq 0 ]; then
      _g=$(marker_gen "$WORK/m.json") || _rc=1
    elif missing_rc "$_rc"; then
      _g=0 # no marker (pre-marker backup, or marker missing) — freshness unknown
    fi
    if [ "$_rc" -ne 0 ] && ! missing_rc "$_rc" && [ "$_section" = "${_name}_legacy" ] && crypt_payload_invalid "$_out"; then
      # A folder-root copy that will not decrypt is another wallet's, from
      # before wallets had folders. Any other failure holds the restore.
      log "[$_label] holds another wallet's copy; skipped"
      continue
    fi
    if [ "$_rc" -ne 0 ] && ! missing_rc "$_rc"; then
      if printf '%s' "$_out" | grep -q 'knownhosts: key'; then
        log "[$_label] presented a different host key than the one saved"
        _hostkey=1
      else
        log "[$_label] could not be consulted"
      fi
      grep -qx "$_name" "$WORK/unreachable" || echo "$_name" >> "$WORK/unreachable"
      continue
    fi
    log "[$_label] available snapshot gen=$_g"
    echo "$_g $_name $_section" >> "$WORK/gens"
  done
  if [ -s "$WORK/unreachable" ]; then
    _down=$(paste -sd, "$WORK/unreachable" | sed 's/,/, /g')
    log "restore waiting: $_down could not be reached (will retry next start)"
    _msg="Restore is waiting for $_down, which could not be reached: another copy could be older and would then overwrite the newer one. Fix the target, or turn it off in Configure Continuous Backups if it is gone for good, then restart the service."
    # "sftp: hostkey" is the part utils.ts describes and the action re-pins on.
    [ "$_hostkey" = 0 ] || _msg="$_msg; sftp: hostkey"
    state_set_str lastError "$_msg"
    exit 0
  fi
  if [ ! -s "$WORK/gens" ]; then
    log "no copies found (will retry next start)"; exit 0
  fi
  sort -rn "$WORK/gens" > "$WORK/gens.sorted"

  # Seed from the freshest copy that pulls + verifies.
  while read -r _g _name _section; do
    _label=$_name
    [ "${_section%_legacy}" = "$_section" ] || _label="$_name root"
    # The restored watermark bounds every candidate, including fallback and undated copies.
    if [ "$_floor" -gt 0 ] && [ "$_g" -lt "$_floor" ]; then
      log "[$_label] snapshot generation $_g is below required $_floor (0 means unknown); refusing restore"
      state_set_str lastError "No usable wallet snapshot meets the last known generation $_floor. Refused a stale or undated copy (gen=$_g) — replace/fix the target with a current copy, then restart. The wallet cannot start until a usable snapshot is restored; targets are left untouched."
      exit 0
    fi
    log "[$_label] pulling + decrypting snapshot (gen=$_g)..."
    rm -f "$WALLET_DIR/db.sqlite.restored"
    _extra=$(tls_flag "$_name")
    # shellcheck disable=SC2086
    _out=$(rclone --config "$RCONF" copyto "${_section}:$ENC_NAME" "$WALLET_DIR/db.sqlite.restored" $RCLONE_FLAGS $_extra 2>&1)
    if [ $? -ne 0 ]; then
      log "[$_label] pull/decrypt failed: $(echo "$_out" | tail -n 2 | tr '\n' ' ')"; continue
    fi
    # A target can serve a copy cut to its encryption header: it decrypts to
    # zero bytes, which integrity_check alone accepts. Seed only a wallet.
    if [ "$(wallet_state "$WALLET_DIR/db.sqlite.restored")" = wallet ]; then
      # The marker only ranked the copy; its own stamp says how current it is.
      # A watermark at v2 or later means every current copy is stamped.
      _own=$(numor0 "$(sqlite3 "$WALLET_DIR/db.sqlite.restored" "SELECT max(gen) FROM $GEN_TABLE" 2>/dev/null)")
      if [ "$_own" -eq 0 ] && [ "$_stamped" -lt 2 ]; then _own=$_g; fi
      if [ "$_floor" -gt 0 ] && [ "$_own" -lt "$_floor" ]; then
        log "[$_label] the snapshot itself is from gen=$_own, below required $_floor; trying the next copy"
        rm -f "$WALLET_DIR/db.sqlite.restored"
        continue
      fi
      # A marker cannot rank a stamped snapshot above its own generation.
      if [ "$_own" -lt "$_g" ]; then
        log "[$_label] marker says gen=$_g but the snapshot is older (gen=$_own); trying the next copy"
        rm -f "$WALLET_DIR/db.sqlite.restored"
        continue
      fi
      [ "$_own" = "$_g" ] || log "[$_label] marker says gen=$_g, the snapshot itself gen=$_own"
      if ! sqlite3 "$WALLET_DIR/db.sqlite.restored" "DROP TABLE IF EXISTS $GEN_TABLE" 2>/dev/null; then
        log "[$_label] could not prepare the snapshot; trying the next copy"
        rm -f "$WALLET_DIR/db.sqlite.restored"
        continue
      fi
      mv "$WALLET_DIR/db.sqlite.restored" "$DB"
      printf '{"gen":%s,"v":%s}\n' "$_own" "$_stamped" > "$WATERMARK"
      clear_flag
      log "[$_label] restored db.sqlite from snapshot (gen=$_own)"
      exit 0
    fi
    log "[$_label] decrypted snapshot holds no wallet; trying the next copy"
    rm -f "$WALLET_DIR/db.sqlite.restored"
  done < "$WORK/gens.sorted"

  log "could not restore from any target (will retry next start)"
  exit 0
}

# ---- watcher loop ----------------------------------------------------------
SHOULD_EXIT=0
cleanup() { SHOULD_EXIT=1; pkill -P $$ -f inotifywait 2>/dev/null; exit 0; }

watch_loop() {
  trap cleanup TERM INT
  mkdir -p "$WORK"
  log "started"
  # The local backup is always on, so we always back up once a wallet exists —
  # no config/enable gate. External targets (if any) are added by build_conf.
  while :; do
    [ "$SHOULD_EXIT" = 1 ] && exit 0
    if [ ! -f "$DB" ]; then sleep 5; continue; fi
    # Block until the DB changes or the backstop timer fires; either way we
    # fall through to do_backup, which no-ops if the snapshot hash is unchanged.
    inotifywait -q -t "$BACKSTOP" -e modify,move_self,close_write "$DB" >/dev/null 2>&1
    [ "$SHOULD_EXIT" = 1 ] && exit 0
    sleep "$DEBOUNCE"
    do_backup normal
  done
}

case "${1:-}" in
  --once)    mkdir -p "$WORK"; do_backup force ;;
  --restore) mkdir -p "$WORK"; ( flock -x 9 && do_restore ) 9>/data/backup-agent.lock ;;
  *)         watch_loop ;;
esac
