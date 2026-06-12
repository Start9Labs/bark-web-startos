export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Bark Wallet!': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,

  // interfaces.ts
  'Web UI': 4,
  'The Bark Wallet web interface': 5,

  // actions/setUiPassword.ts, init/initializeService.ts
  'Set UI Password': 6,
  'Generate a new password for logging in to the Bark Wallet web interface. The username is always "admin".':
    7,
  'This replaces any existing password. Update saved logins after running it.': 8,
  'Generate a password to log in to the Bark Wallet web interface': 9,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
