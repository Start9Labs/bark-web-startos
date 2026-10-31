import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.10.0:1',
  releaseNotes: {
    en_US:
      "Documentation-only release: the instructions link Bark's documentation at its new address.",
    es_ES:
      'Versión solo de documentación: las instrucciones enlazan la documentación de Bark en su nueva dirección.',
    de_DE:
      'Reine Dokumentationsversion: Die Anleitung verlinkt die Bark-Dokumentation unter ihrer neuen Adresse.',
    pl_PL:
      'Wydanie wyłącznie dokumentacyjne: instrukcje prowadzą do dokumentacji Bark pod jej nowym adresem.',
    fr_FR:
      'Version de documentation uniquement : les instructions renvoient vers la documentation de Bark à sa nouvelle adresse.',
  },
  migrations: {},
})
