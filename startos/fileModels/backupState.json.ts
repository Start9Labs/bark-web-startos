import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// Runtime status written by backup-agent.sh and read by the `backup-status`
// health check. Excluded from the native StartOS backup so it never travels
// stale into a restore. Timestamps are epoch seconds.
export const backupStateShape = z.looseObject({
  lastSuccess: z.number().nullable().catch(null),
  lastError: z.string().nullable().catch(null),
  lastHash: z.string().nullable().catch(null),
})

export type BackupStateJson = z.infer<typeof backupStateShape>

export const backupStateJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: '.bark/.backup-state.json' },
  backupStateShape,
)
