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
ENC_NAME=wallet.db         # logical object name inside each crypt remote
META_NAME=wallet.meta      # per-target freshness marker (encrypted alongside)

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
# "provider:path" for each ENABLED external target in the structured config.
remotes() {
  for _p in gdrive dropbox nextcloud sftp; do
    [ "$(cfg ".$_p.enabled // false")" = true ] || continue
    _pp=$(cfg ".$_p.path // empty"); [ -n "$_pp" ] || _pp=bark-backups
    printf '%s:%s\n' "$_p" "$_pp"
  done
}
# All ship/restore targets: the always-on local backup plus any external ones.
all_targets() { printf '%s\n' "$LOCAL_REMOTE"; remotes; }
# A target the user marked as trusting a self-signed cert (LAN Nextcloud, etc.).
# The snapshot is already client-side encrypted, so skipping TLS verification
# only ever exposes ciphertext. Echoes the rclone flag to add, or nothing.
tls_flag() { [ "$(cfg ".$1.insecureTls // false")" = true ] && printf '%s' '--no-check-certificate'; }

# ---- key derivation --------------------------------------------------------
# Deterministic crypt passwords from the wallet mnemonic. Both encrypt and
# decrypt go through here, so the exact byte handling only needs to be
# self-consistent (the same script does both).
derive() { # context -> base64 key
  printf '%s' "$(cat "$MNEMONIC")" | openssl dgst -sha256 -hmac "$1" -binary | base64 | tr -d '\n'
}

# Build an effective rclone.conf from the STRUCTURED config: one section per
# enabled target, plus one crypt wrapper per target (<name>_enc). rclone does
# encrypt+upload / download+decrypt in one step, so we never handle ciphertext
# filenames ourselves. Target passwords are stored PLAINTEXT in the config and
# obscured HERE with `rclone obscure` — the only format rclone accepts — so the
# TS side never round-trips through an obscure/reveal heuristic.
build_conf() {
  mkdir -p "$WORK"
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
    {
      printf '\n[sftp]\ntype = sftp\nhost = %s\nuser = %s\nkey_use_agent = false\nport = %s\nset_modtime = false\n' \
        "$(cfg '.sftp.host // empty')" "$(cfg '.sftp.user // empty')" "$(cfg '.sftp.port // "22"')"
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
  for _remote in $(all_targets); do
    _name=$(echo "$_remote" | cut -d: -f1)
    _path=$(echo "$_remote" | cut -d: -f2-)
    cat >> "$RCONF" <<EOF

[${_name}_enc]
type = crypt
remote = ${_name}:${_path}
password = $_pw
password2 = $_pw2
filename_encryption = off
directory_name_encryption = false
EOF
  done
}

snapshot() {
  mkdir -p "$WORK"
  rm -f "$SNAP"
  # .timeout waits out an in-flight barkd write rather than erroring SQLITE_BUSY.
  sqlite3 "$DB" ".timeout 10000" "VACUUM INTO '$SNAP'" 2>/dev/null || return 1
  [ -s "$SNAP" ] || return 1
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
  for _remote in $(all_targets); do
    _name=$(echo "$_remote" | cut -d: -f1)
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
      _reason=$(echo "$_out" | tail -n 2 | tr '\n' ' ' | sed 's/  */ /g; s/^ *//; s/ *$//')
      printf '%s: %s\n' "$_name" "$_reason" >> "$WORK/failures"
      _all_ok=1
    fi
  done
  return $_all_ok
}

# One backup cycle. Pass "force" to bypass the unchanged-hash skip.
do_backup() {
  [ -f "$DB" ] || { log "no db.sqlite yet (wallet not created)"; return 0; }
  [ -f "$MNEMONIC" ] || { log "no mnemonic; cannot derive backup key"; return 0; }
  if ! snapshot; then log "snapshot failed"; state_set_str lastError "snapshot failed"; return 1; fi
  _hash=$(sha256sum "$SNAP" | awk '{print $1}')
  if [ "$1" != "force" ] && [ "$_hash" = "$(state_get lastHash)" ]; then
    # Unchanged since the last successful backup — skip silently (barkd touches
    # the DB periodically, so this is the common case; logging it spams).
    rm -f "$SNAP"
    return 0
  fi
  build_conf
  # Generation = ship time. "Freshest = max gen" lets restore pick the newest
  # target and detect a rolled-back one (target gen < watermark).
  _gen=$(date +%s)
  printf '{"gen":%s}\n' "$_gen" > "$WORK/wallet.meta"
  _prev_success=$(state_get lastSuccess)
  _prev_error=$(state_get lastError)
  if ship; then
    state_set_num lastSuccess "$_gen"
    state_set_str lastHash "$_hash"
    state_clear lastError
    printf '{"gen":%s}\n' "$_gen" > "$WATERMARK"
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
}

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
  # prior refusal, or a previous restore already seeded it).
  if [ -s "$DB" ]; then
    log "db.sqlite already present; leaving it untouched"; clear_flag; exit 0
  fi
  log "restore pending: locating the freshest wallet snapshot"
  if [ ! -f "$MNEMONIC" ]; then log "no mnemonic restored; starting fresh"; clear_flag; exit 0; fi
  build_conf
  _floor=$(numor0 "$(jq -r '.gen // 0' "$WATERMARK" 2>/dev/null || echo 0)")

  # Collect "<gen> <remote>" for every reachable target (local + externals).
  : > "$WORK/gens"
  for _remote in $(all_targets); do
    _name=$(echo "$_remote" | cut -d: -f1)
    remote_is_onion "$_name" && { log "[$_name] skipped (.onion unsupported)"; continue; }
    rm -f "$WORK/m.json"
    _extra=$(tls_flag "$_name")
    # shellcheck disable=SC2086
    if rclone --config "$RCONF" copyto "${_name}_enc:$META_NAME" "$WORK/m.json" $RCLONE_FLAGS $_extra 2>/dev/null; then
      _g=$(numor0 "$(jq -r '.gen // 0' "$WORK/m.json" 2>/dev/null || echo 0)")
    else
      _g=0 # no marker (pre-marker backup, or marker missing) — freshness unknown
    fi
    log "[$_name] available snapshot gen=$_g"
    echo "$_g $_remote" >> "$WORK/gens"
  done
  if [ ! -s "$WORK/gens" ]; then
    log "no reachable targets; barkd will start fresh (will retry next start)"; exit 0
  fi
  sort -rn "$WORK/gens" > "$WORK/gens.sorted"
  _best=$(numor0 "$(head -n1 "$WORK/gens.sorted" | awk '{print $1}')")

  # Rollback detection: the newest target is older than what we last shipped.
  if [ "$_best" -gt 0 ] && [ "$_floor" -gt 0 ] && [ "$_best" -lt "$_floor" ]; then
    log "STALE: newest target snapshot (gen=$_best) is older than last known (gen=$_floor) — target rolled back. Refusing to restore a stale wallet."
    state_set_str lastError "Backup target looks rolled back (newest gen=$_best is older than last known $_floor). Refused to restore a stale wallet — replace/fix the target with a current copy, then restart. barkd is running with no wallet until then; the target is left untouched."
    # Leave pendingRestore set (retry once a fresh target appears) and seed
    # nothing — barkd waits for the user, so the target is not overwritten.
    exit 0
  fi

  # Seed from the freshest target that pulls + verifies.
  while read -r _g _remote; do
    _name=$(echo "$_remote" | cut -d: -f1)
    remote_is_onion "$_name" && continue
    log "[$_name] pulling + decrypting snapshot (gen=$_g)..."
    rm -f "$WALLET_DIR/db.sqlite.restored"
    _extra=$(tls_flag "$_name")
    # shellcheck disable=SC2086
    _out=$(rclone --config "$RCONF" copyto "${_name}_enc:$ENC_NAME" "$WALLET_DIR/db.sqlite.restored" $RCLONE_FLAGS $_extra 2>&1)
    if [ $? -ne 0 ]; then
      log "[$_name] pull/decrypt failed: $(echo "$_out" | tail -n 2 | tr '\n' ' ')"; continue
    fi
    if sqlite3 "$WALLET_DIR/db.sqlite.restored" "PRAGMA integrity_check" 2>/dev/null | grep -qi '^ok$'; then
      mv "$WALLET_DIR/db.sqlite.restored" "$DB"
      printf '{"gen":%s}\n' "$_g" > "$WATERMARK"
      clear_flag
      log "[$_name] restored db.sqlite from freshest snapshot (gen=$_g)"
      exit 0
    fi
    log "[$_name] integrity check failed on decrypted DB"
    rm -f "$WALLET_DIR/db.sqlite.restored"
  done < "$WORK/gens.sorted"

  log "could not restore from any target; barkd will start fresh (will retry next start)"
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
  --restore) mkdir -p "$WORK"; do_restore ;;
  *)         watch_loop ;;
esac
