import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.2.6:0',
  releaseNotes: {
    en_US:
      'Updates Bark Wallet to 0.2.6: adds a dark mode (toggle in Settings). Full changelog: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.2.6/CHANGELOG.md',
    es_ES:
      'Actualiza Bark Wallet a 0.2.6: añade un modo oscuro (conmutador en Ajustes). Registro de cambios completo: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.2.6/CHANGELOG.md',
    de_DE:
      'Aktualisiert Bark Wallet auf 0.2.6: fügt einen Dunkelmodus hinzu (Schalter in den Einstellungen). Vollständiges Änderungsprotokoll: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.2.6/CHANGELOG.md',
    pl_PL:
      'Aktualizuje Bark Wallet do 0.2.6: dodaje tryb ciemny (przełącznik w Ustawieniach). Pełna lista zmian: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.2.6/CHANGELOG.md',
    fr_FR:
      'Met à jour Bark Wallet vers 0.2.6 : ajoute un mode sombre (bascule dans les Paramètres). Journal des modifications complet : https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.2.6/CHANGELOG.md',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
