import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { backupAgentScript } from '../utils'

// Trigger one backup cycle immediately, independent of the watcher debounce —
// useful to verify a freshly-configured target works. Always ships at least to
// the always-on local backup, plus any configured external targets.
export const backupNow = sdk.Action.withoutInput(
  'backup-now',

  async ({ effects }) => ({
    name: i18n('Back Up Now'),
    description: i18n(
      'Immediately snapshot, encrypt, and ship the wallet database to the local backup and any configured external targets.',
    ),
    warning: i18n(
      'Uploads a fresh encrypted snapshot of the wallet database to the local backup and every enabled external target, replacing the copy each one holds.',
    ),
    allowedStatuses: 'only-running',
    group: i18n('Continuous Backups'),
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
      async (sub) =>
        sub.exec(['sh', backupAgentScript, '--once'], { timeout: null }),
    )

    if (res.exitCode !== 0) {
      throw new Error(
        i18n('Backup run failed (exit ${code}): ${output}', {
          code: String(res.exitCode),
          output: String(res.stderr || res.stdout),
        }),
      )
    }

    return {
      version: '1',
      title: i18n('Backup Triggered'),
      message: i18n(
        'A backup run completed. Check the service logs for per-target upload results.',
      ),
      result: null,
    }
  },
)
