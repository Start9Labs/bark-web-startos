import { i18n } from './i18n'
import { sdk } from './sdk'
import { storeJson } from './fileModels/store.json'
import { uiPort, uiUsername } from './utils'

export const setInterfaces = sdk.setupInterfaces(async ({ effects }) => {
  // bark-web and barkd run keyless; the OS reverse proxy enforces basic auth at
  // the edge. The Set UI Password critical task blocks startup until a password
  // is set, so the empty fallback never serves.
  const password =
    (await storeJson.read((s) => s?.uiPassword).const(effects)) ?? ''

  const uiMulti = sdk.MultiHost.of(effects, 'ui-multi')
  const uiMultiOrigin = await uiMulti.bindPort(uiPort, {
    protocol: 'http',
    addSsl: {
      auth: {
        type: 'basic',
        credentials: [{ username: uiUsername, password }],
        realm: null,
      },
    },
  })
  const ui = sdk.createInterface(effects, {
    name: i18n('Web UI'),
    id: 'ui',
    description: i18n('The Bark Wallet web interface'),
    type: 'ui',
    masked: false,
    schemeOverride: null,
    username: null,
    path: '',
    query: {},
  })

  const uiReceipt = await uiMultiOrigin.export([ui])

  return [uiReceipt]
})
