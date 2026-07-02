export const uiPort = 8080
export const apiPort = 4001
export const barkdPort = 4000

export const walletDir = '/data/.bark'
// Display-only path shown in the wallet's backup-reminder UI; must match walletDir.
export const walletDataPath = `${walletDir}/`
// UI-auth files live at the volume ROOT, not inside walletDir. barkd treats its
// datadir (/data/.bark) as wallet-owned and aborts wallet creation if it finds
// any unrecognized file there ("Datadir has unexpected contents"). Keeping these
// under /data (a sibling of .bark) leaves the datadir clean for barkd. The
// password path must match the uiPasswordFile file model's subpath.
export const uiPasswordPath = `/data/ui_password`
export const uiSessionSecretPath = `/data/ui_session_secret`

// Continuous-backup paths. The shell agent (backup-agent.sh) hardcodes the
// matching absolute paths — keep the two in sync.
export const walletDb = `${walletDir}/db.sqlite`
export const mnemonicPath = `${walletDir}/mnemonic`
export const backupConfigSubpath = 'backup-config.json' // /data/backup-config.json
export const startupFlagsSubpath = 'startupFlags.json' // /data/startupFlags.json
export const backupStateSubpath = '.bark/.backup-state.json' // /data/.bark/.backup-state.json
export const backupAgentScript = '/usr/local/bin/backup-agent.sh'
export const backupFolderDefault = 'bark-backups'
// Always-on local backup: an on-box rclone `local` remote (managed by
// backup-agent.sh, not user-configurable). It lives on the main volume so it IS
// included in the native StartOS backup (rides along with everything else), and
// on restore it's just another target under the same freshness guard — never
// authoritative over a fresher off-box copy. Same-box, so it does NOT survive
// losing this server; an external target is required for true recoverability.
export const localBackupPath = '/data/local-backups'

export const arkServer = 'https://ark.second.tech'
export const chainSource = 'https://mempool.second.tech/api'
export const barkNetwork = 'mainnet'
