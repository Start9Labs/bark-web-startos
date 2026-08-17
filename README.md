<p align="center">
  <img src="icon.png" alt="Bark Wallet Logo" width="21%">
</p>

# Bark Wallet on StartOS

> Everything not listed in this document should behave the same as upstream
> Bark. If a feature, setting, or behavior is not mentioned here, the upstream
> documentation is accurate and fully applicable — see the Documentation
> section of `instructions.md` for links.

[Bark](https://gitlab.com/ark-bitcoin/labs/bark-web) is a self-custodial Ark wallet with a web interface, running on Bitcoin mainnet against Second's hosted Ark server. This package adds the two things a self-hosted Ark wallet cannot do without: a login gate in front of the wallet, and continuous encrypted backup of a database that a periodic snapshot cannot safely capture.

- **Upstream repo:** <https://gitlab.com/ark-bitcoin/labs/bark-web>
- **Wrapper repo:** <https://github.com/Start9Labs/bark-web-startos>

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

One image, built here, running four daemons that StartOS supervises independently.

| Property      | Value                                |
| ------------- | ------------------------------------ |
| Image         | Built from `bark.Dockerfile`         |
| Architectures | x86_64, aarch64                      |
| Command       | One per daemon; no shared entrypoint |

| Subcontainer       | Runs          | Internal Port | Purpose                                               |
| ------------------ | ------------- | ------------- | ----------------------------------------------------- |
| `barkd-sub`        | `barkd`       | 4000          | The wallet daemon itself — HTTP and WebSocket         |
| `api-sub`          | The Node API  | 4001          | The login gate and the proxy that holds barkd's token |
| `nginx-sub`        | nginx         | 8080          | Serves the app and proxies to the API                 |
| `backup-agent-sub` | A shell agent | —             | Watches the wallet database and ships snapshots       |

The `barkd` binary is fetched from the upstream release with a pinned checksum; the web app and API are built from the upstream tag.

**`--expose-mnemonic` is passed to `barkd` and is load-bearing.** Upstream made the mnemonic endpoint opt-in and 404 by default, and the wallet's Settings screen is the only place a user can ever read their recovery phrase — the upstream create and import pages are unreachable here. Without the flag a user could never record the seed that both recovers their funds and decrypts their backups. It is safe because the endpoint is reachable only through the API's session-guarded route, on a daemon bound to loopback behind a bearer token.

## Volume and Data Layout

One volume, and where a file sits on it decides whether it is backed up.

| Volume | Mount Point | Purpose                                      |
| ------ | ----------- | -------------------------------------------- |
| `main` | `/data`     | Wallet data, UI-auth files, and backup state |

| Path                       | Written by | Holds                                                     |
| -------------------------- | ---------- | --------------------------------------------------------- |
| `.bark/db.sqlite`          | `barkd`    | The wallet database — **excluded** from the native backup |
| `.bark/mnemonic`           | `barkd`    | The seed                                                  |
| `.bark/auth_token`         | `barkd`    | The bearer token; never reaches the browser               |
| `.bark/.backup-state.json` | The agent  | Backup status — excluded from the native backup           |
| `ui_password`              | An action  | The web login password                                    |
| `ui_session_secret`        | The API    | Session signing key — excluded from the native backup     |
| `backup-config.json`       | An action  | External backup targets and their credentials             |
| `startupFlags.json`        | Restore    | The one-shot pending-restore flag                         |
| `backup-watermark.json`    | The agent  | The newest generation shipped, for rollback detection     |
| `local-backups/`           | The agent  | Encrypted snapshots of the always-on local backup         |

**The UI-auth files sit at the volume root, not in `barkd`'s directory, and that is not tidiness.** `barkd` treats its data directory as wallet-owned and aborts wallet creation if it finds any file it does not recognise there. Keeping `ui_password` and `ui_session_secret` as siblings of `.bark/` leaves that directory clean.

## File Models

Four models, and the interesting thing about them is that the largest file on the volume is deliberately _not_ one.

| File                       | Format | Modelled                  | Written by                      |
| -------------------------- | ------ | ------------------------- | ------------------------------- |
| `ui_password`              | text   | Yes — `FileHelper.string` | The Set UI Password action      |
| `backup-config.json`       | JSON   | Yes — `FileHelper.json`   | The Configure Backups action    |
| `.bark/.backup-state.json` | JSON   | Yes — `FileHelper.json`   | The backup agent                |
| `startupFlags.json`        | JSON   | Yes — `FileHelper.json`   | Restore, consumed at next start |

**`ui_password`** is the canonical login password, read live by the API on every request rather than loaded once. `main` holds a reactive read of it, so rotating the password restarts the API — and because the session signature folds the password in, a rotation invalidates every existing session immediately.

**`backup-config.json`** holds each external target's settings and credentials, with a per-target enabled flag. Credentials are stored **verbatim**, not rclone-obscured: the agent obscures them at the moment it writes rclone's config, so nothing round-trips through an obscure/reveal heuristic. That is not a downgrade — rclone's obscuring uses a fixed public key and protects nothing. What protects them is that the volume is encrypted, and that every snapshot is encrypted with a seed-derived key before it leaves the box.

Toggling a target off keeps its credentials, so re-enabling never means re-typing them.

**`.backup-state.json`** is runtime status, written by the agent and read by the health check. It is excluded from the native backup precisely so a stale status can never travel into a restore and look current.

**`startupFlags.json`** carries one flag, set by the post-restore hook and consumed by the oneshot that pulls the wallet database back before `barkd` opens it.

The wallet database has no model and is never touched by package code. Three values — the Ark server, the chain source, and the network — are compiled in and passed to the API as environment; there is no form for them.

## Dependencies

None. The wallet reaches Second's hosted Ark server and chain source over the internet rather than depending on a local Bitcoin node.

## Network Access and Interfaces

One interface, and the two internal ports behind it are never exposed.

| Interface | Id   | Type | Port | Description             |
| --------- | ---- | ---- | ---- | ----------------------- |
| Web UI    | `ui` | ui   | 8080 | The Bark Wallet web app |

Bound on the `ui-multi` MultiHost over HTTP and not masked. `barkd` and the API bind loopback only; the four daemons share the service network namespace.

**Authentication happens inside the container, not at the StartOS edge.** The API serves a native login page and gates every wallet route behind a signed HttpOnly session cookie issued after a constant-time password check. Consequences worth knowing:

- **It fails closed.** With no password file the API returns `503` rather than serving an open wallet, so a fresh install cannot be reached before its password task is done. The auth flag is also baked into the image, so a dropped runtime variable cannot open it either.
- **Changing the password signs everyone out**, immediately, because the signing key folds in the password and the API reads it live per request.
- **The cookie's `Secure` flag is set from the forwarded protocol**, so the same build works over Tor's HTTP and LAN's HTTPS.
- **CSRF needs both** a strict-same-site cookie and a custom header on state-changing methods, and login carries a global exponential-backoff lockout.
- **The seed is served by one session-guarded route only.** The proxy 404s the underlying endpoint under any path encoding, and nginx blocks the exact path as a second layer.
- **The notifications WebSocket needs a single-use ticket** minted through the gated REST surface, which itself requires the bearer token injected server-side.

## Installation and First-Run Flow

A oneshot creates the wallet directory before `barkd` starts, on every launch. On a restore, a second oneshot runs first and pulls the newest external snapshot into place **before** `barkd` opens the database — see [Backups and Restore](#backups-and-restore).

The wallet itself is created by the web app: on first load it sees no wallet, generates a twelve-word phrase in the browser, and posts it. Upstream's create and import pages exist but nothing links to them, so this is the only path a user reaches.

Install raises three tasks, and the two backup ones are raised **once**, on install only — they are not re-created if the user later removes their targets. The ongoing indicator for that is the health check.

**The order that matters:** set a password (nothing is reachable until then), acknowledge the backup risk, then add an external target. A user who stops after the first two has a working wallet with a local-only backup, which is the state the health check reports as failing.

## Actions

Four actions. One is authentication, three are backup.

### Set UI Password

Generates a new random password for the web login and shows it once. Run it when its task appears, and any time you want to rotate or recover the credential.

- **What it changes:** `ui_password` on the volume.
- **Cost:** the API restarts, and **every existing session is signed out**.
- **Repeat safety:** idempotent in effect, but each run produces a new password and invalidates the old one.
- **Outputs:** the password, shown once.

### Backup Safety — Backups group

A required acknowledgement, not a setting. Run it when its critical task appears.

- **What it changes:** records the acknowledgement in the backup config.
- **Repeat safety:** re-runnable, though there is no reason to.
- **It will refuse to complete unless you accept** — submitting without accepting throws.
- **It is required regardless of your backup configuration.** Adding an external target does not clear it, because the point is that the user has understood the risk, not that they have mitigated it.

### Configure Backups — Backups group

Adds encrypted off-box targets: Google Drive, Dropbox, Nextcloud, or SFTP. Run it during setup, and again to add, change, or disable a target.

- **What it changes:** `backup-config.json`.
- **Cost:** immediate; available at any status.
- **Repeat safety:** idempotent. Entries are saved even for targets left disabled, and disabling one keeps its credentials.
- **Google Drive and Dropbox take two passes** — submit once with app credentials to get a sign-in link, approve it, then paste the returned code back into the form.
- **A Nextcloud on the LAN with a self-signed certificate** needs the trust toggle enabled.
- **What to do next:** run Back Up Now to confirm the target works, then take a StartOS backup — the config is the pointer a restore needs.

### Back Up Now — Backups group

Forces an immediate snapshot and upload. Run it to verify a newly configured target.

- **When to run it:** only while the service is running.
- **What it changes:** ships a snapshot to every enabled target and updates the backup state.
- **Repeat safety:** idempotent.

## Tasks

Three, and they differ in whether they can come back.

| Task                | Severity    | Raised when                          | Cleared when                    |
| ------------------- | ----------- | ------------------------------------ | ------------------------------- |
| Set UI Password     | `critical`  | Any init that finds no password file | Set UI Password runs            |
| Backup Safety       | `critical`  | At install only                      | The acknowledgement is accepted |
| Add a backup target | `important` | At install only                      | Configure Backups runs          |

The password task is **reactive** — it is re-raised on any init that finds no password, so deleting the file brings the prompt back rather than leaving an unreachable service.

The two backup tasks are raised on install alone. That is deliberate: they are onboarding, and re-raising them every time a user changed their mind about a target would be nagging. The **Wallet Backup** health check is the ongoing indicator instead.

`critical` blocks the service from starting and suspends the ordinary controls, so a fresh install shows tasks and nothing else.

## Health Checks

Five checks, but only two are shown. The rest pass no display — they exist so a failing daemon restarts the service, not to be read.

| Check           | Displayed as    | Method                               |
| --------------- | --------------- | ------------------------------------ |
| `nginx`         | "Web Interface" | Port 8080 is listening               |
| `backup-status` | "Wallet Backup" | The backup configuration and state   |
| `barkd`         | — internal      | Port 4000 is listening               |
| `api`           | — internal      | Port 4001 is listening               |
| `backup-agent`  | — internal      | Always succeeds while the agent runs |

**"Wallet Backup" reports failure when no external target is configured**, and that is a deliberate judgement rather than a fault. A local backup always runs, but recovering it depends on a manual StartOS backup, so it is likely stale exactly when it is needed — which for an Ark wallet risks funds received or moved since. The check says so in its message and points at the action.

With an external target configured it reports the age of the last successful backup, and turns to failure only when a backup has been failing for more than half an hour. A configured target that has not shipped anything yet reports success with an explanation, rather than sitting on a spinner — a wallet with no activity has nothing to back up.

A service restarting with no failing check displayed is one of the internal daemons; the service logs name it.

## Backups and Restore

**The wallet database is deliberately excluded from the StartOS backup**, and this is the most important thing to understand about this package.

A native backup is point-in-time and stops the service, so it cannot capture a rolling wallet database safely — and for an Ark wallet a stale database is not an inconvenience, it is fund loss: every Ark or Lightning payment advances the wallet state, so restoring an old copy rolls the wallet back past payments it has already made.

So the two halves are split:

- **The backup agent ships the database continuously**, encrypted with a key derived from the seed, to every enabled target — plus, always, to an on-box local copy. It snapshots on change with a periodic backstop.
- **The native StartOS backup keeps the small, static remainder**: the seed, the bearer token, the login password, the backup configuration, the freshness watermark, and the local snapshots.

Excluded from the native backup: the database and its journals, the backup status file, and the session secret — the last so that a restore regenerates it and forces a clean re-login.

**Restore pulls the newest copy, and refuses a stale one.** The post-restore hook sets a flag; on the next start, a oneshot fetches and decrypts the freshest snapshot from the configured targets and writes the database _before_ `barkd` opens it. If the newest copy it finds is older than the watermark it restored, it **refuses to load it** rather than reverting the wallet — which is what makes a rolled-back backup target survivable. Two independent targets mean a rolled-back one is outvoted.

With no target ever configured, or none reachable, the wallet starts from the seed alone: on-chain funds, plus whatever Ark balance the server's recovery mailbox can rebuild.

**Two things must both be kept**: the recovery phrase, which decrypts every snapshot and cannot be recovered from anything else, and a current StartOS backup, which holds _where_ the snapshots live and the credentials to fetch them.

## Limitations and Differences

1. **Mainnet only.** The Ark server, chain source, and network are compiled in; signet and regtest are not selectable.
2. **The wallet database is not in the StartOS backup**, by design. A restore without a reachable target recovers only what the seed can rebuild.
3. **A local-only backup is reported as a failing health check.** It is a floor, not protection — it does not survive losing the server.
4. **The wallet is created automatically** on first load. There is no import path exposed, so an existing seed cannot be restored through the UI.
5. **Rotating the login password signs out every session**, unavoidably.
6. **There is no configuration form.** Changing the Ark server or network means editing the package source and rebuilding.
7. **A rolled-back backup target is refused, not merged.** The service will ask for a current copy rather than load an older one.

---

## Quick Reference for AI Consumers

```yaml
package_id: bark-web # note: the title is "Bark Wallet"
image: built from ./bark.Dockerfile
architectures:
  - x86_64
  - aarch64
subcontainers:
  - barkd-sub # the wallet daemon
  - api-sub # login gate and barkd proxy
  - nginx-sub # serves the app
  - backup-agent-sub # continuous backup
volumes:
  main: /data
file_models:
  - ui_password
  - backup-config.json
  - .bark/.backup-state.json
  - startupFlags.json
startos_managed_env_vars: # all passed to the api daemon
  - PORT
  - HOST
  - WALLET_DIR
  - WALLET_DATA_PATH
  - BARKD_URL
  - ARK_SERVER
  - CHAIN_SOURCE
  - BARK_NETWORK
  - UI_AUTH
  - UI_PASSWORD_FILE
  - UI_SESSION_SECRET_FILE
dependencies: []
interfaces:
  ui: { type: ui, port: 8080 } # 4000 and 4001 are loopback-only
actions:
  - set-ui-password
  - configure-backup
  - accept-backup-risk
  - backup-now
tasks:
  - { action: set-ui-password, severity: critical } # reactive
  - { action: accept-backup-risk, severity: critical } # install only
  - { action: configure-backup, severity: important } # install only
health_checks:
  - nginx # displayed "Web Interface"
  - backup-status # displayed "Wallet Backup"
  - barkd # internal
  - api # internal
  - backup-agent # internal
```
