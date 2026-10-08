import { backupConfigJson } from '../fileModels/backupConfig.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Behind the critical Backup Safety task: an explanation of how backups work
// and a required acknowledgement that the user understands the situation and
// accepts that funds can be lost without an external backup AND a safeguarded
// seed. This is informed consent, required of every user — not contingent on
// the current target config. Configure Continuous Backups stays practical.
const WARNING = `<b>How your Bark wallet is backed up — please read.</b><br><br>
Every time your wallet changes (a payment, an Ark round, an on-chain movement), an encrypted copy is sent to your backup target — the key comes from your <b>Bark 12-word recovery phrase</b> (your wallet seed). A backup only protects you if it's <b>current</b> when you restore: an old copy <b>permanently loses any Ark or Lightning funds received or moved since</b> (on-chain funds stay recoverable from your seed).<br><br>
<b>To stay safe, do all three:</b>
<ul>
<li><b>Add an external target</b> (Configure Continuous Backups). The on-box local backup alone survives only inside a manual StartOS backup, so it's usually stale when you need it.</li>
<li><b>Take a StartOS backup afterward</b> (System → Create Backup) and keep its <b>StartOS master password</b>. That backup holds your seed and the pointer to your target; without it a restore can't find your target and comes back stale. Re-take it whenever you change targets.</li>
<li><b>Record your Bark 12-word recovery phrase</b> when the wallet shows it as you create your wallet. If you skipped that step, imported a wallet, or your wallet was created for you by an earlier version, open the wallet, go to <b>Settings</b>, and reveal it.</li>
</ul>
Your web login password is separate and can be regenerated — it isn't a recovery secret. By accepting, you understand you can permanently lose funds without a current external backup, your recovery phrase, and your StartOS master password.`

export const acknowledgeRisk = sdk.Action.withInput(
  'accept-backup-risk',

  async ({ effects }) => ({
    name: i18n('Backup Safety'),
    description: i18n(
      'How your Bark wallet is backed up, and a required acknowledgement that you can lose funds without a current external backup, your 12-word recovery phrase, and your StartOS master password.',
    ),
    warning: i18n(WARNING),
    allowedStatuses: 'any',
    group: i18n('Continuous Backups'),
    visibility: 'enabled',
  }),

  sdk.InputSpec.of({
    accept: sdk.Value.toggle({
      name: i18n('I understand and accept responsibility'),
      description: i18n(
        'I understand how my wallet is backed up, and I accept that I may permanently lose my funds if I do not keep a current external backup, my 12-word recovery phrase, and my StartOS master password.',
      ),
      default: false,
    }),
  }),

  async ({ effects }) => {
    const cfg = await backupConfigJson
      .read()
      .once()
      .catch(() => null)
    return { accept: !!cfg?.riskAccepted }
  },

  async ({ effects, input }) => {
    if (!input.accept)
      throw new Error(
        i18n(
          'You must confirm that you understand the backup situation and accept responsibility before continuing.',
        ),
      )
    await backupConfigJson.merge(effects, { riskAccepted: true })
    return null
  },
)
