<p align="center">
  <img src="icon.png" alt="Bark Wallet Logo" width="21%">
</p>

# Bark Wallet on StartOS

> **Upstream repo:** <https://gitlab.com/ark-bitcoin/labs/bark-web>
>
> Everything not listed in this document should behave the same as upstream
> Bark. If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable.

Bark is a self-custodial Bitcoin wallet built on the [Ark protocol](https://second.tech). Payments settle off-chain through Ark rounds for fast, low-fee transfers while the user keeps unilateral exit to the base chain. This package wraps the `bark-web` GUI together with the `barkd` wallet daemon and serves them as a single StartOS web service on Bitcoin mainnet.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property      | Value                                                            |
| ------------- | ---------------------------------------------------------------- |
| Image         | Custom (`bark.Dockerfile`)                                        |
| Architectures | x86_64, aarch64                                                  |
| Processes     | `barkd` (wallet daemon), node API proxy, nginx (SPA + reverse proxy) |

A single image runs three processes, each supervised independently by StartOS:

| Daemon  | Command                                              | Internal Port | Role                                            |
| ------- | ---------------------------------------------------- | ------------- | ----------------------------------------------- |
| `barkd` | `barkd --port 4000 --host 127.0.0.1 --datadir /data/.bark` | 4000          | Wallet daemon (HTTP + WebSocket)                |
| `api`   | `node /app/api/dist/index.js`                        | 4001          | Hono proxy; injects the barkd bearer token      |
| `nginx` | `nginx -g 'daemon off;'`                             | 8080          | Serves the SPA, proxies `/api/` and `/barkd-ws/` |

The `barkd` binary is fetched from the upstream GitLab release with a pinned SHA-256 checksum; the `bark-web` SPA and API proxy are built from the upstream git tag.

---

## Volume and Data Layout

| Volume | Mount Point | Purpose                  |
| ------ | ----------- | ------------------------ |
| `main` | `/data`     | Wallet data (`/data/.bark`), package store (`/data/store.json`) |

Everything the wallet persists lives under `/data/.bark`:

- `db.sqlite` — wallet database (shipped externally by the backup agent; **excluded** from the native StartOS backup)
- `mnemonic` — seed
- `auth_token` — barkd bearer token (never reaches the browser)
- `.backup-state.json` — backup agent status (excluded from native backup)

Package-level state on `/data`:

- `store.json` — `uiPassword`, materialized to `.bark/ui_password` and enforced by the bark-web API's native login gate (`UI_AUTH`)
- `backup-config.json` — continuous-backup target(s) + credentials (base64 rclone config; the restore "pointer")
- `startupFlags.json` — `pendingRestore` flag set by `setPostRestore`, consumed by the `restore-pull` oneshot
- `backup-watermark.json` — newest shipped generation; restore's "newest known" witness (included in native backup)
- `local-backups/` — encrypted snapshots for the always-on local backup (included in native backup; same-box safety floor)

---

## Installation and First-Run Flow

A `mkdir -p /data/.bark` oneshot runs before `barkd` starts on every launch. On first run the wallet is empty — the user creates or restores a wallet through the web UI.

The web interface is gated by the bark-web API's own native login page (the `UI_AUTH` gate — see [Authentication](#authentication)), not by edge basic auth. On init, a critical **Set UI Password** task is created whenever `store.json` has no `uiPassword`, so a fresh install cannot serve the wallet until the user generates a password (the API fails closed with `503` until the password file exists).

**Backups always run locally** (the agent ships to `/data/local-backups` unconditionally), so there's no "backups off" state. Two **one-time onboarding tasks** are created on first install (`kind === 'install'`, not reactive — they aren't re-created if the user later removes targets; the health check is the ongoing indicator):

- `startos/init/taskAcknowledgeRisk.ts` → a **critical** task pointing at the **Backup Safety** action (`accept-backup-risk`): a required, informed acknowledgement that the user understands funds can be lost without an external backup **and** a safeguarded seed. Submitting without accepting throws; accepting returns no result and records `riskAccepted`. Clears only when acknowledged — required regardless of target config (not auto-cleared by adding an external target).
- `startos/init/taskAddBackupTarget.ts` → an **important** task pointing at **Configure Backups**. Clears when that action runs.

Ongoing protection is surfaced by the **Wallet Backup** health check: **failure** while no external target is configured (the local backup is recoverable only via a manual, stale-prone StartOS backup), **success with the last-backup time** once one is.

---

## Configuration Management

| StartOS-Managed (baked into the image)                          | Upstream-Managed                          |
| --------------------------------------------------------------- | ----------------------------------------- |
| Ark server `https://ark.second.tech`                            | Wallet creation, send/receive, refreshes  |
| Chain source `https://mempool.second.tech/api`                  | (everything else via the bark-web UI)     |
| Network `mainnet`                                               |                                           |

These three values are passed to the API daemon as environment variables (`ARK_SERVER`, `CHAIN_SOURCE`, `BARK_NETWORK`). There is no StartOS config form; to change them, edit `startos/utils.ts` and rebuild.

---

## Network Access and Interfaces

| Interface | Port | Protocol | Purpose             |
| --------- | ---- | -------- | ------------------- |
| Web UI    | 8080 | HTTP     | Bark Wallet web app |

The OS reverse proxy terminates TLS and forwards to nginx; authentication is handled inside the container by the bark-web API's native login gate (see [Authentication](#authentication)), not at the edge. Unauthenticated wallet requests get `401`.

**Access methods:**

- LAN IP with unique port
- `<hostname>.local` with unique port
- Tor `.onion` address
- Custom domains (if configured)

Ports 4000 (barkd) and 4001 (api) are bound to `127.0.0.1` only and are never exposed; the three daemons share the service network namespace.

---

## Authentication

The wallet authenticates **inside the container**, at the bark-web API (Hono, port 4001) — there is no basic-auth at the StartOS edge proxy. This is a single native login page rather than a browser popup.

**Flow:**

- `main.ts` materializes `store.json.uiPassword` into `/data/.bark/ui_password` (mode 600, via a `write-ui-password` oneshot that runs before the API) and passes `UI_AUTH=true` + `UI_PASSWORD_FILE` to the API. `UI_AUTH=true` is also baked into the image (`ENV`) so a dropped runtime env can never serve an open wallet.
- The API gates `/api/barkd/*` and `/api/logs`: it requires a signed **HttpOnly** session cookie (`bark_session`), issued by `POST /api/login` after a constant-time password check. The cookie payload carries an absolute expiry; its signature key folds in the password, so the API reads the password live per request and **changing the password instantly invalidates all sessions**. If the password file is missing/empty the API **fails closed** (`503`), never open.
- CSRF: `SameSite=Strict` cookie **plus** an `X-Requested-With: bark` header required on all state-changing methods.
- Login is rate-limited with a global exponential-backoff lockout.
- Cookie `Secure` flag is set conditionally on `X-Forwarded-Proto === https` (nginx-forwarded), so it works over Tor (http) and LAN (https) alike.
- The `barkd` notifications WebSocket is reached via nginx at the exact path `/barkd-ws/api/v1/notifications/ws` only; it requires a single-use, 10-minute ticket minted through the gated REST surface (which itself requires barkd's bearer token, injected server-side). No ticket without passing the gate.

The session signing secret lives at `/data/.bark/ui_session_secret` (mode 600, generated atomically) and is **excluded from the native backup** so a restore regenerates it (forcing a clean re-login). The `ui_password` file is not excluded because it is rematerialized from `store.json` on every init.

---

## Actions (StartOS UI)

| Action                 | ID                 | Purpose                                                                              |
| ---------------------- | ------------------ | ------------------------------------------------------------------------------------ |
| Set UI Password        | `set-ui-password`   | Generate a new random password for the web UI login (also signs out existing sessions) |
| Configure Backups      | `configure-backup`  | Add/configure **external** backup targets (Drive, Dropbox, Nextcloud, SFTP). Important-task target. |
| Backup Safety          | `accept-backup-risk`| Acknowledge (toggle) that funds can be lost without a current external backup and a safeguarded seed. Critical-task target. |
| Back Up Now            | `backup-now`        | Run one backup cycle immediately (local + any externals) via a temp subcontainer     |

**Set UI Password** is created as a critical task on first install (and any time `uiPassword` is missing); also runnable on demand to rotate the password. The backup actions live in the **Backups** group.

---

## Backups and Restore

A stale Bark database means **permanent fund loss** (forfeited input VTXOs become unspendable; VTXOs created after the snapshot are absent), and the Ark server cannot reconstruct wallet state from the seed today — so seed-only restore is *not* a recovery path. The native StartOS backup is point-in-time and stops the service, so it cannot capture a fast-moving wallet safely. This package therefore ships a **continuous external backup** and narrows the native backup to a pointer.

**Continuous backup (`backup-agent.sh`, the `backup-agent` daemon):** a sidecar watches `/data/.bark/db.sqlite` with `inotifywait` (plus an unconditional ~5-minute backstop timer). On any change it debounces, takes a consistent snapshot with `sqlite3 VACUUM INTO`, skips if the snapshot hash is unchanged, encrypts via an rclone `crypt` remote whose password is derived from the wallet mnemonic (`HMAC-SHA256(mnemonic, context)`), and `rclone copy`s the ciphertext to every enabled target. Status is written to `/data/.bark/.backup-state.json`.

We chose inotify-on-the-DB over barkd's WebSocket movement stream deliberately: it fires on *every* mutation (including silent on-chain/BDK writes), needs no ticket/auth dance, and can't miss events.

**Native StartOS backup (`startos/backups.ts`):** `ofVolumes('main')` with `db.sqlite` (and its journal/wal/shm and `.backup-state.json`) **excluded**. What remains is the small, static pointer: `.bark/mnemonic`, `.bark/auth_token`, `store.json` (UI password), and `backup-config.json` (target location + credentials). `setPostRestore` sets `pendingRestore: true` in `startupFlags.json`.

**Restore behavior:** after the native restore, the `restore-pull` oneshot (`main.ts`, ordered **before** `barkd`) runs `backup-agent.sh --restore`: if `pendingRestore` is set and a target is configured, it derives the key from the restored mnemonic, pulls each target's freshness marker, seeds `db.sqlite` from the **freshest** target (decrypt + integrity-check), and writes it before barkd opens it. On success it clears the flag and advances the watermark; if no target is reachable it leaves the flag set (retry next start) and barkd starts fresh from the seed.

**Staleness guard (rolled-back target).** A target the user backs up and later restores can be silently reverted to an older state — which would revert the wallet and lose funds. Each snapshot carries a monotonic generation (`wallet.meta`, ship time, encrypted alongside `wallet.db.bin`), and the latest generation is recorded in `backup-watermark.json` on `/data` — which **is** included in the native StartOS backup, so it travels back on restore as an independent "newest known" witness. On restore, if even the freshest target's generation is **older than the watermark**, the target has been rolled back: the oneshot **refuses to seed** (writes a `lastError`, surfaced by the health check, and leaves the flag set), barkd starts with no wallet so the target is **not** overwritten, and the user is told to replace the target with a current copy. Limit: with a single target, a rollback to a point *after* the last StartOS backup can't be detected (the watermark is only as fresh as the last native backup) — **use 2+ independent targets** so a rolled-back one is outvoted by a fresh one (restore picks the max generation).

**Encryption & keys:** the snapshot contains the plaintext `mnemonic`, so egress is always encrypted. The key is seed-derived (no separate passphrase, automatic restore); decrypting a backup requires the seed, which is already full wallet control, so the backup grants no extra access. Losing the seed = total loss (the backup can't help). The native backup is itself encrypted under the user's StartOS password and carries the target credentials.

**Always-on local target:** the agent unconditionally ships to an on-box rclone `local` remote at `/data/local-backups` (fixed managed path, no credentials, not user-configurable). Unlike the live `db.sqlite`, this folder is **not** excluded from the native StartOS backup — its encrypted snapshots ride along as a same-box recovery floor. On restore it's just another target in the freshness comparison; because it's captured in the native backup alongside the watermark, its generation equals the floor, so a fresher off-box target always wins and `local` is never authoritative. After losing the box it survives only inside the native StartOS backup — which is manual and point-in-time, so at restore it's typically stale; an external target stays current and is what makes recovery you can rely on.

**External targets:** Google Drive, Dropbox, Nextcloud (WebDAV), and SFTP via a bundled `rclone` — added in the **Configure Backups** action. Each is a top-level object with an **`Enabled` toggle** alongside its settings, so toggling one off keeps its saved credentials (the section stays in `rcloneConfig`; only `selectedRcloneRemotes` — the externals the agent ships to — changes). Secrets are rclone-obscured. `localhost`/`127.0.0.1`/`::1`/`0.0.0.0` and `.onion` targets are rejected at config time (a same-box service can't survive losing this box; no SOCKS proxy in this image yet), and the action warns to use independent hardware. `ship()` requires **all** targets (local + externals) to succeed, so a failing external surfaces as a health failure and is retried.

---

## Health Checks

| Check         | Method                | Surfaced | Messages                                                      |
| ------------- | --------------------- | -------- | ------------------------------------------------------------- |
| Web Interface | Port listening (8080) | Yes      | "The web interface is ready" / "The web interface is not ready" |
| Wallet Backup | Reads `backup-config.json` + `.backup-state.json` | Yes | `failure` (no external target configured), `success` ("Last backup Nm ago" once shipping; "no backup yet" until the wallet has activity), `failure` (external configured but backups erroring) |

`barkd` (4000), `api` (4001), and the `backup-agent` daemon readiness gate startup ordering but are not displayed directly; backup health is surfaced via the standalone **Wallet Backup** check.

---

## Dependencies

None. The package talks to the hosted Ark server and chain source over the internet; it does not depend on a local Bitcoin node.

---

## Limitations and Differences

1. **Mainnet only** — the Ark server, chain source, and network are fixed to Second's hosted mainnet endpoints. Signet / regtest are not selectable.
2. **No StartOS config form** — the hosted endpoints are baked into the image, not editable from the StartOS UI.
3. **Requires internet** — Ark rounds and chain data come from `ark.second.tech` and `mempool.second.tech`.

---

## What Is Unchanged from Upstream

The `bark-web` UI and `barkd` daemon behave exactly as upstream documents — wallet creation, restore-from-seed, send/receive across Lightning/Ark/on-chain, background refreshes, and unilateral exit. Only the deployment (single StartOS service, hosted endpoints, Tor/LAN access) differs.

---

## Quick Reference for AI Consumers

```yaml
package_id: bark-web
image: custom (bark.Dockerfile)
architectures: [x86_64, aarch64]
volumes:
  main: /data   # wallet at /data/.bark; db.sqlite EXCLUDED from native backup (shipped externally)
                # pointers in native backup: store.json, backup-config.json, startupFlags.json, .bark/mnemonic
ports:
  ui: 8080      # gated by the bark-web API's native login page (UI_AUTH); no edge basic-auth
  barkd: 4000   # localhost only, not exposed
  api: 4001     # localhost only, not exposed
dependencies: none
daemons: [barkd, api, nginx, backup-agent]   # backup-agent: continuous encrypted external backup
backup_targets: { local: always-on (on-box, in native backup), external: [gdrive, dropbox, nextcloud, sftp] }   # via bundled rclone; loopback/.onion rejected
startos_managed_env_vars:
  - PORT
  - WALLET_DIR
  - WALLET_DATA_PATH
  - BARKD_URL
  - ARK_SERVER
  - CHAIN_SOURCE
  - BARK_NETWORK
  - HOST               # 127.0.0.1 — API binds localhost only
  - UI_AUTH            # 'true' — enables the native login gate (also baked into the image)
  - UI_PASSWORD_FILE   # /data/.bark/ui_password — password materialized from store.json
actions:
  - set-ui-password    # generate/rotate the web UI password (signs out existing sessions)
  - configure-backup   # add/configure external backup targets (important-task target)
  - accept-backup-risk # acknowledge stale-backup fund-loss risk (critical-task target)
  - backup-now         # run one backup cycle immediately (local + externals)
encryption: snapshot encrypted via rclone crypt; key = HMAC-SHA256(mnemonic) (seed-derived)
```
