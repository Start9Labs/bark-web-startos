import { i18n } from './i18n'
import { sdk } from './sdk'
import {
  apiPort,
  arkServer,
  barkdPort,
  barkNetwork,
  chainSource,
  uiPort,
  walletDataPath,
  walletDir,
} from './utils'

export const main = sdk.setupMain(async ({ effects }) => {
  console.info(i18n('Starting Bark Wallet!'))

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
      requires: ['init-data'],
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
          WALLET_DIR: walletDir,
          WALLET_DATA_PATH: walletDataPath,
          BARKD_URL: `http://127.0.0.1:${barkdPort}`,
          ARK_SERVER: arkServer,
          CHAIN_SOURCE: chainSource,
          BARK_NETWORK: barkNetwork,
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
})
