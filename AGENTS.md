# AGENTS.md

This is a StartOS service-package repository — it builds a `.s9pk` for StartOS.

Develop it inside a StartOS packaging workspace created by `start-cli s9pk init-workspace`,
which provides the packaging guide and agent context one level up. If you're reading this in a
bare clone with no workspace, the full guide is at <https://docs.start9.com/packaging>.

Work this package's `TODO.md` from top to bottom. Keep `README.md` (technical reference for an AI support or administering agent) and `instructions.md` (end-user docs) in sync with your changes.

## This repo

- **Don't "fix" the backup exclude back to a full-volume backup.** A stale Bark database loses funds, so `db.sqlite` is excluded from the native backup and shipped continuously by `backup-agent.sh` instead. The native backup carries only the pointer needed to fetch the live copy.
- **`--expose-mnemonic` is load-bearing — don't drop it from barkd's command.** Upstream made the mnemonic endpoint opt-in (404 by default), and with `/create` and `/import` unreachable the Settings screen is the only place a user can ever read their recovery phrase. Verified against the 0.6.0 binary: 404 without it, live with it.
- **Authentication is the API's own gate, not edge basic auth.** `UI_AUTH` plus a password file the API reads live per request; the session signature folds the password in, so a rotation invalidates every session. `UI_AUTH=true` is also baked into the image so a dropped runtime env can never serve an open wallet. Don't reintroduce a reverse-proxy credential.
- **`backup-agent.sh` hardcodes absolute paths that `utils.ts` also declares.** Nothing enforces the match — change one and change the other.
- **Editing `backup-agent.sh` does not trigger a local rebuild.** `start-cli s9pk list-ingredients` (which drives `make`'s dependency tracking) lists `bark.Dockerfile` but not the files it `COPY`s, so `make` reuses a stale image. Force it with `touch bark.Dockerfile && make x86 install`; the heavy layers stay cached. CI clean-builds, so this only bites local incremental builds.
- **Reinstalling the same version keeps the old image.** When iterating, `start-cli package install` over an identical version string won't swap the running image — `uninstall` then `install` to deploy a fresh build.
- **Backup credentials are stored verbatim, not rclone-obscured, on purpose.** The agent obscures them when it writes `rclone.conf`, so nothing round-trips through an obscure/reveal heuristic (that heuristic was fragile). rclone's obscuring uses a fixed public key and protects nothing; the volume encryption and the seed-derived snapshot encryption are what do.
