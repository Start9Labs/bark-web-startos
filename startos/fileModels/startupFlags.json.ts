import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// One-shot flags read at startup. `pendingRestore` is set by backups.ts
// setPostRestore and consumed by the `restore-pull` oneshot in main.ts, which
// pulls + decrypts the latest external snapshot into db.sqlite before barkd
// opens the database. backup-agent.sh --restore clears it on success.
export const startupFlagsShape = z.looseObject({
  pendingRestore: z.boolean().catch(false),
})

export type StartupFlagsJson = z.infer<typeof startupFlagsShape>

export const startupFlagsJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'startupFlags.json' },
  startupFlagsShape,
)
