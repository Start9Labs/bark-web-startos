import { utils } from '@start9labs/start-sdk'
import { uiPasswordFile } from '../fileModels/uiPassword'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const setUiPassword = sdk.Action.withoutInput(
  'set-ui-password',

  async ({ effects }) => ({
    name: i18n('Set UI Password'),
    description: i18n(
      'Generate a new password for logging in to the Bark Wallet web interface. Rotating it also signs out any active sessions.',
    ),
    warning: (await uiPasswordFile.read().const(effects))
      ? i18n(
          'The current password stops working and every active session is signed out.',
        )
      : null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const password = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 32,
    })

    // Write the canonical password file the API reads directly — no store.
    await uiPasswordFile.write(effects, password)

    return {
      version: '1',
      title: i18n('UI Password'),
      message: i18n(
        'Use this password to log in to the Bark Wallet web interface in your browser.',
      ),
      result: {
        type: 'single',
        name: i18n('Password'),
        description: null,
        value: password,
        masked: true,
        copyable: true,
        qr: false,
      },
    }
  },
)
