import { acknowledgeRisk } from '../actions/acknowledgeRisk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Critical onboarding task, created ONCE on first install: a required, informed
// acknowledgement of how backups work and that funds can be lost without an
// external backup and a safeguarded seed. Clears only when the user runs the
// Backup Safety action and accepts — required regardless of target config.
export const taskAcknowledgeRisk = sdk.setupOnInit(async (effects, kind) => {
  if (kind !== 'install') return
  await sdk.action.createOwnTask(effects, acknowledgeRisk, 'critical', {
    reason: i18n(
      'Review how your wallet is backed up and acknowledge the risk: restoring a stale backup can permanently lose Ark/Lightning funds received or moved since it was taken. A current external backup and a safeguarded recovery phrase are what protect you.',
    ),
  })
})
