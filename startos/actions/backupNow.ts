import { sdk } from '../sdk'
import { backupAgentScript } from '../utils'

// Trigger one backup cycle immediately, independent of the watcher debounce —
// useful to verify a freshly-configured target works. Always ships at least to
// the always-on local backup, plus any configured external targets.
export const backupNow = sdk.Action.withoutInput(
  'backup-now',

  async ({ effects }) => ({
    name: 'Back Up Now',
    description:
      'Immediately snapshot, encrypt, and ship the wallet database to the local backup and any configured external targets.',
    warning: null,
    allowedStatuses: 'only-running',
    group: 'Backups',
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const res = await sdk.SubContainer.withTemp(
      effects,
      { imageId: 'bark' },
      sdk.Mounts.of().mountVolume({
        volumeId: 'main',
        subpath: null,
        mountpoint: '/data',
        readonly: false,
      }),
      'backup-now',
      async (sub) => sub.exec(['sh', backupAgentScript, '--once']),
    )

    if (res.exitCode !== 0) {
      throw new Error(
        `Backup run failed (exit ${res.exitCode}): ${String(res.stderr || res.stdout)}`,
      )
    }

    return {
      version: '1',
      title: 'Backup Triggered',
      message:
        'A backup run completed. Check the service logs for per-target upload results.',
      result: null,
    }
  },
)
