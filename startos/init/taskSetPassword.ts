import { setUiPassword } from '../actions/setUiPassword'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

// Runs on every init (install, update, restore, and plain restart), and
// re-runs reactively when the watched files change.
export const taskSetPassword = sdk.setupOnInit(async (effects) => {
  // Prompt for a UI password whenever none is set — the proxy basic-auth gate
  // stays locked (setupInterfaces falls back to an empty password) until the
  // user runs this critical task.
  const uiPassword = await storeJson.read((s) => s?.uiPassword).const(effects)
  if (!uiPassword) {
    await sdk.action.createOwnTask(effects, setUiPassword, 'critical', {
      reason: i18n(
        'Generate a password to log in to the Bark Wallet web interface',
      ),
    })
  }
})
