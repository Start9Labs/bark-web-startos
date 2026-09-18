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

// barkd's own debug log. From bark 0.6.2 the file logger shares the terminal
// logger's level (Info by default, raised by BARK_LOG), and --no-logfile turns
// it off entirely — but nothing upstream rotates or bounds the file, and the
// wallet's Settings screen downloads it, so it is capped here rather than
// disabled.
export const debugLogPath = `${walletDir}/debug.log`
export const debugLogMaxBytes = 64 * 1024 * 1024

// barkd holds debug.log open with O_APPEND, so truncating in place is safe:
// the next write lands at offset 0 rather than leaving a sparse hole, and barkd
// never has to be restarted to reclaim the space.
export const capDebugLogScript = `
set -eu
while :; do
  if [ -f ${debugLogPath} ] && [ "$(stat -c %s ${debugLogPath})" -gt ${debugLogMaxBytes} ]; then
    : > ${debugLogPath}
  fi
  sleep 15
done
`
export const backupConfigSubpath = 'backup-config.json' // /data/backup-config.json
export const startupFlagsSubpath = 'startupFlags.json' // /data/startupFlags.json
export const backupStateSubpath = '.bark/.backup-state.json' // /data/.bark/.backup-state.json
export const backupAgentScript = '/usr/local/bin/backup-agent.sh'
export const backupFolderDefault = 'bark-backups'

// Nextcloud serves a user's files over WebDAV at /remote.php/dav/files/USER/,
// a form neither its UI nor StartOS's Nextcloud interface shows.
export function nextcloudDavUrl(address: string, user: string): string {
  let url: URL
  try {
    url = new URL(address)
  } catch {
    throw new Error('Nextcloud: that is not a valid address.')
  }
  if (!user || /\/dav\/files\/[^/]+/.test(url.pathname)) return address
  const base = url.pathname
    .replace(/\/+$/, '')
    .replace(/\/(remote\.php\/(dav|webdav)|index\.php.*|apps\/.*)$/, '')
  return `${url.origin}${base}/remote.php/dav/files/${encodeURIComponent(user)}/`
}
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
