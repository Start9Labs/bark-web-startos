import { utils } from '@start9labs/start-sdk'
import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'

export const setUiPassword = sdk.Action.withoutInput(
  'set-ui-password',

  async ({ effects }) => ({
    name: i18n('Set UI Password'),
    description: i18n(
      'Generate a new password for logging in to the Bark Wallet web interface. Rotating it also signs out any active sessions.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  async ({ effects }) => {
    const password = utils.getDefaultString({
      charset: 'a-z,A-Z,0-9',
      len: 32,
    })

    await storeJson.merge(effects, { uiPassword: password })

    return {
      version: '1',
      title: 'UI Password',
      message:
        'Use this password to log in to the Bark Wallet web interface in your browser.',
      result: {
        type: 'single',
        name: 'Password',
        description: null,
        value: password,
        masked: true,
        copyable: true,
        qr: false,
      },
    }
  },
)
