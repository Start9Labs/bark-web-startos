# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

**Start every task at the recipe index** — `../start-technologies/projects/start-sdk/docs/src/recipes.md`
(or <https://docs.start9.com/packaging/recipes.html>). It maps an intent ("prompt the user to create
admin credentials", "expose a web UI") to the constructs, the reference pages, and a named production
package to copy. Find the recipe before you read this package's neighbours: a package you reach by
grepping may be non-conformant, and the recipe outranks it.

Freshly scaffolded? Work the
[New Package Checklist](../start-technologies/projects/start-sdk/docs/src/new-package-checklist.md)
(or <https://docs.start9.com/packaging/new-package-checklist.html>) from top to bottom. It is a
guide page, not a file in this repo — read it, don't copy it in.

Keep `README.md` (technical reference for an AI support or administering agent) and
`instructions.md` (end-user docs) in sync with your changes.

**Bugs and feature requests are GitHub issues on this repo** — file them as you find them.
Don't record work in the repo instead: no `TODO.md`, no `NOTES.md`, no `PLAN.md`. What you
verified, tried, and decided belongs in the commit message and the PR body.

## This repo

- **Package id is `bark-web`.** Ships a self-custodial Ark wallet: `barkd` (wallet daemon), a Node API, and an nginx-fronted web UI run as separate daemons off the same `main` volume. The web UI binding (`ui`) is gated by OS reverse-proxy basic auth (`admin` + a user-set password); the "Set UI Password" critical task blocks startup until a password is set.
- **Continuous backup, not StartOS backup.** A stale Bark DB loses funds, so the wallet `db.sqlite` is **excluded** from the native StartOS backup (`startos/backups.ts`) and shipped continuously by `backup-agent.sh` (the `backup-agent` daemon) to a user-configured target, encrypted with a key derived from the wallet mnemonic. The native backup carries only the pointer (mnemonic, `store.json`, `backup-config.json`). Don't "fix" the exclude back to a full-volume backup. See README → "Backups and Restore".
- **The chain source is the user's own `bitcoind`, and it is only settable at wallet creation.** bark-web v0.5.0+ builds a bitcoind `ChainSourceConfig` from `BITCOIND_RPC_URL` + `BITCOIND_RPC_COOKIE_FILE`, so no upstream patching is needed — but barkd persists the choice in `/data/.bark/config.toml` and exposes no endpoint to change it later. `setupMain` rewrites that file for wallets created against the old hosted explorer. **`esplora_address` must be deleted, not just joined by the bitcoind keys** — barkd prefers esplora when both are set. And `config.toml` must not exist before wallet creation: barkd fails with `Cannot provide an existing config file and config flags`. Full reasoning in README → "Chain Source"; don't re-derive it from the barkd binary.
- **Editing `backup-agent.sh` does not trigger a local rebuild.** `start-cli s9pk list-ingredients` (which drives `make`'s dependency tracking) lists `bark.Dockerfile` but **not** the files the Dockerfile `COPY`s. So after editing `backup-agent.sh`, `make` thinks the `.s9pk` is up to date and reuses a stale image. Force it: `touch bark.Dockerfile && make x86 install` (Docker re-COPYs the new script; the heavy layers stay cached). CI clean-builds, so this only bites local incremental builds.
- **`--expose-mnemonic` is load-bearing — don't drop it from barkd's command.** barkd 0.5.0 made `GET /api/v1/wallet/mnemonic` opt-in (404 by default). Upstream's `/create` and `/import` pages are unreachable, so the wallet's Settings screen is the only place a user can ever read their recovery phrase; without the flag they can never record it. Verified against the 0.6.0 binary: 404 without, live with.
- **Reinstalling the same version keeps the old image.** When iterating, `start-cli package install` over an identical version string won't swap the running image — `uninstall` then `install` to deploy a fresh build.

## Inspecting a running install

To run a command inside the service's container (read its generated config, grep app logs), use `start-cli package attach bark-web -n <name> -- <cmd>`. Select the subcontainer by **name** with `-n` — the names passed to `SubContainer.of` in `main.ts` are `barkd-sub`, `api-sub`, `nginx-sub`, and `backup-agent-sub` — or by image with `-i`. Note: `-s/--subcontainer` matches the internal **Guid**, not the name, so passing a name to `-s` fails with "no matching subcontainers".
