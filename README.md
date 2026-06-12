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

- `db.sqlite` — wallet database
- `mnemonic` — seed
- `auth_token` — barkd bearer token (never reaches the browser)

`/data/store.json` holds StartOS-managed state separate from the wallet — currently the `uiPassword` enforced by the reverse-proxy basic-auth gate.

---

## Installation and First-Run Flow

A `mkdir -p /data/.bark` oneshot runs before `barkd` starts on every launch. On first run the wallet is empty — the user creates or restores a wallet through the web UI.

The web interface is gated by HTTP basic auth enforced at the StartOS reverse proxy (username `admin`). On init, a critical **Set UI Password** task is created whenever `store.json` has no `uiPassword`, so a fresh install cannot serve the wallet until the user generates a password.

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

The OS reverse proxy terminates TLS and enforces HTTP basic auth (username `admin`, password from `store.json`) before forwarding to nginx. Unauthenticated requests get `401`.

**Access methods:**

- LAN IP with unique port
- `<hostname>.local` with unique port
- Tor `.onion` address
- Custom domains (if configured)

Ports 4000 (barkd) and 4001 (api) are bound to `127.0.0.1` only and are never exposed; the three daemons share the service network namespace.

---

## Actions (StartOS UI)

| Action            | ID                | Purpose                                                                 |
| ----------------- | ----------------- | ---------------------------------------------------------------------- |
| Set UI Password   | `set-ui-password` | Generate a new random password for the web UI login (username `admin`) |

Created as a critical task on first install (and any time `uiPassword` is missing); also runnable on demand to rotate the password.

---

## Backups and Restore

**Included in backup:**

- `main` volume (the entire `/data/.bark` wallet directory)

**Restore behavior:** the volume is fully restored before the service starts, returning the wallet exactly as it was. A user holding only the twelve-word seed can instead choose **Restore** in the web UI and rebuild balances from the Ark server.

---

## Health Checks

| Check         | Method                | Surfaced | Messages                                                      |
| ------------- | --------------------- | -------- | ------------------------------------------------------------- |
| Web Interface | Port listening (8080) | Yes      | "The web interface is ready" / "The web interface is not ready" |

`barkd` (4000) and `api` (4001) readiness gate daemon startup ordering but are not displayed to the user.

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
package_id: bark-wallet
image: custom (bark.Dockerfile)
architectures: [x86_64, aarch64]
volumes:
  main: /data   # wallet at /data/.bark, package store at /data/store.json
ports:
  ui: 8080      # basic-auth gated at the OS reverse proxy (user: admin)
  barkd: 4000   # localhost only, not exposed
  api: 4001     # localhost only, not exposed
dependencies: none
startos_managed_env_vars:
  - PORT
  - WALLET_DIR
  - WALLET_DATA_PATH
  - BARKD_URL
  - ARK_SERVER
  - CHAIN_SOURCE
  - BARK_NETWORK
actions:
  - set-ui-password   # generate/rotate the web UI password (basic auth, user: admin)
```
