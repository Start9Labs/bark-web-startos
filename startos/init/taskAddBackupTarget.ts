import { configureBackup } from '../actions/configureBackup'
import { sdk } from '../sdk'

// Important onboarding task, created ONCE on first install: recommend adding an
// external target. Clears when the user runs Configure Continuous Backups. Not
// re-created if they later remove all targets — the "Continuous Backup" health
// check is the ongoing indicator for that.
export const taskAddBackupTarget = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return
  await sdk.action.createOwnTask(effects, configureBackup, 'important', {
    reason:
      'Add an external target (Google Drive, Dropbox, Nextcloud, or SFTP) for the continuous backup. The local copy on this server is recoverable only from a manual StartOS backup and is likely stale — an external target stays current.',
  })
})
