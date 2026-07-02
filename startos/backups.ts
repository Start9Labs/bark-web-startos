import { sdk } from './sdk'
import { startupFlagsJson } from './fileModels/startupFlags.json'

// The native StartOS backup is point-in-time and stops the service, so it
// cannot capture the wallet DB safely on a rolling basis — and a stale Bark DB
// means permanent fund loss. We therefore EXCLUDE the live database from the
// native backup and let backup-agent.sh ship it continuously to an external
// target instead. The native backup keeps only the small, static bits — the
// mnemonic, auth token, the UI password (ui_password), the backup target
// config, and the freshness watermark — that a restore needs to log in and
// fetch the latest DB. The session secret (ui_session_secret) is excluded so a
// restore regenerates it, forcing a clean re-login.
// The always-on local backup's encrypted snapshots (/data/local-backups)
// are intentionally NOT excluded, so they ride along in the native backup as a
// same-box recovery floor — pinned to the watermark, so restore never prefers
// them over a fresher off-box target.
export const { createBackup, restoreInit } = sdk.setupBackups(
  async ({ effects }) =>
    sdk.Backups.ofVolumes('main')
      .setOptions({
        exclude: [
          '.bark/db.sqlite',
          '.bark/db.sqlite-journal',
          '.bark/db.sqlite-wal',
          '.bark/db.sqlite-shm',
          '.bark/.backup-state.json',
          'ui_session_secret',
        ],
      })
      .setPostRestore(async (effects) => {
        // Tell the restore-pull oneshot to fetch + decrypt the latest external
        // snapshot before barkd opens the (now absent) database.
        await startupFlagsJson.merge(effects, { pendingRestore: true })
      }),
)
