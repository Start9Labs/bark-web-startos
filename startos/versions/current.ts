import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.2.5:0',
  releaseNotes: {
    en_US: 'Updates Bark Wallet to 0.2.5: fixes wallet creation over plain HTTP.',
    es_ES:
      'Actualiza Bark Wallet a 0.2.5: corrige la creación del monedero sobre HTTP simple.',
    de_DE:
      'Aktualisiert Bark Wallet auf 0.2.5: behebt die Wallet-Erstellung über einfaches HTTP.',
    pl_PL:
      'Aktualizuje Bark Wallet do 0.2.5: naprawia tworzenie portfela przez zwykłe HTTP.',
    fr_FR:
      'Met à jour Bark Wallet vers 0.2.5 : corrige la création du portefeuille via HTTP simple.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
