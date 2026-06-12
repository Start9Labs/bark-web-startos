import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.2.3:0',
  releaseNotes: {
    en_US: 'Initial Start9 release. Self-custodial Ark wallet for Bitcoin mainnet.',
    es_ES:
      'Versión inicial de Start9. Monedero Ark autocustodial para la red principal de Bitcoin.',
    de_DE:
      'Erste Start9-Veröffentlichung. Selbstverwahrendes Ark-Wallet für das Bitcoin-Mainnet.',
    pl_PL:
      'Pierwsze wydanie Start9. Samodzielny portfel Ark dla sieci głównej Bitcoin.',
    fr_FR:
      'Première version Start9. Portefeuille Ark auto-hébergé pour le réseau principal Bitcoin.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
