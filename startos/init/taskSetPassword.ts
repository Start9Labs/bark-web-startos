import { setUiPassword } from '../actions/setUiPassword'
import { uiPasswordFile } from '../fileModels/uiPassword'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Runs on every init (install, update, restore, and plain restart), and
// re-runs reactively when the watched files change.
export const taskSetPassword = sdk.setupOnInit(async (effects) => {
  // Prompt for a UI password whenever none is set — the API fails closed (503)
  // until the password file exists, so the native login gate is never served
  // open until the user runs this critical task.
  const uiPassword = await uiPasswordFile.read().const(effects)
  if (!uiPassword) {
    await sdk.action.createOwnTask(effects, setUiPassword, 'critical', {
      reason: i18n(
        'Generate a password to log in to the Bark Wallet web interface',
      ),
    })
  }
})
