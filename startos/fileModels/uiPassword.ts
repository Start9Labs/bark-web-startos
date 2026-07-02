import { FileHelper } from '@start9labs/start-sdk'
import { sdk } from '../sdk'

// The canonical UI login password: a plain-text file at the volume root that the
// Set UI Password action writes directly and the bark-web API reads live
// (UI_PASSWORD_FILE). No intermediate store — path must match uiPasswordPath in
// utils.ts. Lives at /data/ui_password (NOT inside barkd's datadir /data/.bark,
// which barkd treats as wallet-owned and refuses to share).
export const uiPasswordFile = FileHelper.string({
  base: sdk.volumes.main,
  subpath: 'ui_password',
})
