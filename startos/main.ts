import { backupConfigJson } from './fileModels/backupConfig.json'
import { backupStateJson } from './fileModels/backupState.json'
import { storeJson } from './fileModels/store.json'
import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  apiPort,
  arkServer,
  backupAgentScript,
  barkdPort,
  barkNetwork,
  chainSource,
  uiPasswordFile,
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

  await storeJson.read((s) => s?.uiPassword).const(effects)

  const mounts = sdk.Mounts.of().mountVolume({
    volumeId: 'main',
    subpath: null,
    mountpoint: '/data',
    readonly: false,
  })

  const barkdSub = await sdk.SubContainer.of(
    effects,
    { imageId: 'bark' },
    mounts,
    'barkd-sub',
  )

  return sdk.Daemons.of(effects)
    .addOneshot('init-data', {
      subcontainer: barkdSub,
      exec: { command: ['mkdir', '-p', walletDir] },
      requires: [],
    })
    .addOneshot('write-ui-password', {
      // Materialize the UI password from store.json into a mode-600 file the API
      // reads (UI_PASSWORD_FILE). jq reads/writes files directly so the secret
      // never appears in process args; umask 077 makes the file owner-only.
      subcontainer: barkdSub,
      exec: {
        command: [
          'sh',
          '-c',
          `umask 077 && jq -r '.uiPassword // ""' /data/store.json > ${uiPasswordFile}`,
        ],
      },
      requires: ['init-data'],
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
      subcontainer: await sdk.SubContainer.of(
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
          CHAIN_SOURCE: chainSource,
          BARK_NETWORK: barkNetwork,
          UI_AUTH: 'true',
          UI_PASSWORD_FILE: uiPasswordFile,
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
      requires: ['barkd', 'write-ui-password'],
    })
    .addDaemon('nginx', {
      subcontainer: await sdk.SubContainer.of(
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
      subcontainer: await sdk.SubContainer.of(
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
          if (!cfg?.selectedRcloneRemotes?.length)
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
