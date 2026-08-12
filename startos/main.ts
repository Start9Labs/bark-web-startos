import { manifest as bitcoinManifest } from 'bitcoin-core-startos/startos/manifest'
import { backupConfigJson } from './fileModels/backupConfig.json'
import { backupStateJson } from './fileModels/backupState.json'
import { barkConfigToml } from './fileModels/barkConfig.toml'
import { uiPasswordFile } from './fileModels/uiPassword'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  apiPort,
  arkServer,
  backupAgentScript,
  barkdPort,
  barkNetwork,
  bitcoindRpcUrl,
  btcCookiePath,
  btcMountpoint,
  uiPasswordPath,
  uiSessionSecretPath,
  uiPort,
  walletDataPath,
  walletDir,
} from './utils'

function ago(seconds: number): string {
  if (seconds < 90) return `${seconds}s`
  if (seconds < 5400) return `${Math.round(seconds / 60)}m`
  if (seconds < 172800) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86400)}d`
}

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Bark Wallet!'))

  // Re-run (restarting the API) whenever the UI password changes, so a rotate
  // takes effect and drops existing sessions.
  await uiPasswordFile.read().const(effects)

  // Reactive: main re-runs when bitcoind's bridge address changes, so a
  // reinstall or port change repins the chain source below.
  const rpcUrl = await bitcoindRpcUrl(effects)

  // Point an existing wallet at the local node before barkd opens it. bark-web
  // sets the chain source only at wallet creation and barkd exposes no endpoint
  // to change it afterwards, so config.toml is the only route for a wallet
  // created against the hosted explorer. It also heals a stale bitcoind bridge
  // address or a restore onto a different server. `esplora_address` has to go
  // rather than simply be joined by the bitcoind keys — barkd prefers esplora
  // when both are set.
  //
  // No config.toml means no wallet yet: leave it absent, because barkd rejects
  // wallet creation outright ("Cannot provide an existing config file and config
  // flags") when a config file and request-level config flags both exist, and
  // the create request always carries them.
  if (rpcUrl) {
    const config = await barkConfigToml.read().once()
    if (
      config &&
      (config.esplora_address !== undefined ||
        config.bitcoind_address !== rpcUrl ||
        config.bitcoind_cookiefile !== btcCookiePath)
    ) {
      const { esplora_address, bitcoind_user, bitcoind_pass, ...barkdOwned } =
        config
      await barkConfigToml.write(effects, {
        ...barkdOwned,
        bitcoind_address: rpcUrl,
        bitcoind_cookiefile: btcCookiePath,
      })
    }
  }

  const mounts = sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: '/data',
    readonly: false,
  })

  // barkd authenticates to bitcoind with its cookie, so it alone needs
  // bitcoind's data volume.
  const barkdSub = sdk.SubContainer.of(
    effects,
    { imageId: 'bark' },
    mounts.mountDependency<typeof bitcoinManifest>({
      dependencyId: 'bitcoind',
      volumeId: 'main',
      subpath: null,
      mountpoint: btcMountpoint,
      readonly: true,
    }),
    'barkd-sub',
  )

  return sdk.Daemons.of(effects)
    .addOneshot('init-data', {
      subcontainer: barkdSub,
      exec: { command: ['mkdir', '-p', walletDir] },
      requires: [],
    })
    .addOneshot('restore-pull', {
      // On a restore (pendingRestore flag), fetch + decrypt the latest external
      // wallet snapshot and write db.sqlite BEFORE barkd opens the database.
      // No-ops on a normal start or when no target is configured.
      subcontainer: barkdSub,
      exec: { command: ['sh', backupAgentScript, '--restore'] },
      requires: ['init-data'],
    })
    .addDaemon('barkd', {
      subcontainer: barkdSub,
      exec: {
        command: [
          'barkd',
          '--port',
          String(barkdPort),
          '--host',
          '127.0.0.1',
          '--datadir',
          walletDir,
          // barkd 0.5.0 made GET /api/v1/wallet/mnemonic opt-in, 404 by
          // default. Upstream's /create and /import pages are unreachable, so
          // the wallet's Settings screen is the only way a user can ever read
          // their recovery phrase — without this they could never record it.
          // From bark-web 0.7.2 the endpoint is reachable only through the
          // API's session-guarded POST /api/reveal-mnemonic, on a daemon bound
          // to loopback behind a bearer token.
          '--expose-mnemonic',
        ],
      },
      ready: {
        display: null,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, barkdPort, {
            successMessage: 'The wallet daemon is ready',
            errorMessage: 'The wallet daemon is starting',
          }),
      },
      requires: ['restore-pull'],
    })
    .addDaemon('api', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'bark' },
        mounts,
        'api-sub',
      ),
      exec: {
        command: ['sh', '-c', 'cd /app/api && exec node dist/index.js'],
        env: {
          PORT: String(apiPort),
          HOST: '127.0.0.1',
          WALLET_DIR: walletDir,
          WALLET_DATA_PATH: walletDataPath,
          BARKD_URL: `http://127.0.0.1:${barkdPort}`,
          ARK_SERVER: arkServer,
          // bark-web builds a bitcoind ChainSourceConfig from these two and
          // ignores CHAIN_SOURCE entirely, so CHAIN_SOURCE is left unset rather
          // than passed alongside — with both, the api warns and discards it.
          // The cookie is read by barkd, not the api, which never stats it.
          BITCOIND_RPC_URL: rpcUrl ?? '',
          BITCOIND_RPC_COOKIE_FILE: btcCookiePath,
          BARK_NETWORK: barkNetwork,
          UI_AUTH: 'true',
          UI_PASSWORD_FILE: uiPasswordPath,
          UI_SESSION_SECRET_FILE: uiSessionSecretPath,
        },
      },
      ready: {
        display: null,
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, apiPort, {
            successMessage: 'The API is ready',
            errorMessage: 'The API is starting',
          }),
      },
      requires: ['barkd'],
    })
    .addDaemon('nginx', {
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'bark' },
        mounts,
        'nginx-sub',
      ),
      exec: { command: ['nginx', '-g', 'daemon off;'] },
      ready: {
        display: i18n('Web Interface'),
        fn: () =>
          sdk.healthCheck.checkPortListening(effects, uiPort, {
            successMessage: i18n('The web interface is ready'),
            errorMessage: i18n('The web interface is not ready'),
          }),
      },
      requires: ['api'],
    })
    .addDaemon('backup-agent', {
      // Watches db.sqlite, snapshots on change (+ a periodic backstop),
      // encrypts with a seed-derived key, and ships to the configured targets.
      subcontainer: sdk.SubContainer.of(
        effects,
        { imageId: 'bark' },
        mounts,
        'backup-agent-sub',
      ),
      exec: { command: ['sh', backupAgentScript] },
      ready: {
        display: null,
        fn: async () => ({ result: 'success', message: 'Active' }),
      },
      requires: ['barkd'],
    })
    .addHealthCheck('chain-source', {
      // The point of this package's chain source is that you can see whose node
      // it is, so surface it rather than leaving an unresolved address to
      // manifest as barkd sync failures.
      ready: {
        display: 'Chain Source',
        fn: async () =>
          rpcUrl
            ? {
                result: 'success',
                message: `Your Bitcoin node, over RPC at ${rpcUrl}`,
              }
            : {
                result: 'failure',
                message:
                  'Bitcoin is unreachable, so the wallet has no chain source. Bitcoin only exposes RPC to other services when pruning is disabled — check that it is running as an archival node.',
              },
      },
      requires: [],
    })
    .addHealthCheck('backup-status', {
      ready: {
        display: 'Wallet Backup',
        fn: async () => {
          const cfg = await backupConfigJson
            .read()
            .once()
            .catch(() => null)
          // A local backup always runs, but recovering it depends on a manual
          // StartOS backup, so it's likely stale when you need it. Only an
          // off-box target stays current — no external target => failing.
          const anyExternal = [
            cfg?.gdrive,
            cfg?.dropbox,
            cfg?.nextcloud,
            cfg?.sftp,
          ].some((t) => t?.enabled)
          if (!anyExternal)
            return {
              result: 'failure',
              message:
                'No external backup target. Your wallet is only backed up locally, recoverable only from a StartOS backup you take manually — likely stale when you need it, risking Ark/Lightning funds received or moved since. Add an off-box target under Actions → Backups.',
            }
          const st = await backupStateJson
            .read()
            .once()
            .catch(() => null)
          const now = Math.floor(Date.now() / 1000)
          if (st?.lastSuccess) {
            const age = now - st.lastSuccess
            if (st.lastError && age > 1800)
              return {
                result: 'failure',
                message: `Backups are failing — last success ${ago(age)} ago: ${st.lastError}`,
              }
            return { result: 'success', message: `Last backup ${ago(age)} ago` }
          }
          // External configured but nothing shipped yet (no wallet / first
          // backup pending) — healthy idle, not a spinner.
          if (st?.lastError)
            return {
              result: 'failure',
              message: `Backup has not succeeded yet: ${st.lastError}`,
            }
          return {
            result: 'success',
            message:
              'No backup has run yet — backups happen automatically once your wallet has activity.',
          }
        },
      },
      requires: ['backup-agent'],
    })
})
