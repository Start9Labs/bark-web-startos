import { T } from '@start9labs/start-sdk'
import { rpcHostId, rpcPort } from 'bitcoin-core-startos/startos/utils'
import { sdk } from './sdk'

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
export const barkNetwork = 'mainnet'

// barkd's wallet config, written by barkd at wallet creation and re-read on
// every start. main.ts rewrites its chain-source keys before barkd opens the
// wallet — bark-web only sets the chain source at creation.
export const configTomlSubpath = '.bark/config.toml'

// bitcoind's data volume, mounted read-only into the barkd subcontainer so
// barkd can read the RPC cookie itself.
export const btcMountpoint = '/mnt/bitcoind'
export const btcCookiePath = `${btcMountpoint}/.cookie`

/**
 * bitcoind's RPC bridge address as a URL (`http://<osIp>:8332`) — the chain
 * source barkd syncs from. `null` while bitcoind is absent; callers then leave
 * the chain source unwritten rather than pinning a fake address, and the
 * `.const()` heals when bitcoind reappears.
 *
 * Only an archival node is reachable here: bitcoin.conf binds RPC to
 * `127.0.0.1:58332` with `rpcallowip=127.0.0.1/32` when pruned, so the bridge
 * resolves to nothing. Hence the `prune: 0` task in dependencies.ts.
 */
export const bitcoindRpcUrl = async (effects: T.Effects) => {
  const bridge = await sdk.host
    .getBridgeAddress(effects, {
      packageId: 'bitcoind',
      hostId: rpcHostId,
      internalPort: rpcPort,
      ssl: false,
    })
    .const()
  return bridge && `http://${bridge}`
}
