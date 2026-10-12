import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.9.0:4',
  releaseNotes: {
    en_US:
      'Restarting Bark Wallet while it is still starting stops every process of the previous run.',
    es_ES:
      'Reiniciar Bark Wallet mientras aún se está iniciando detiene todos los procesos de la ejecución anterior.',
    de_DE:
      'Ein Neustart von Bark Wallet, während es noch startet, beendet alle Prozesse des vorherigen Laufs.',
    pl_PL:
      'Ponowne uruchomienie Bark Wallet w trakcie uruchamiania zatrzymuje wszystkie procesy poprzedniego uruchomienia.',
    fr_FR:
      "Redémarrer Bark Wallet pendant son démarrage arrête tous les processus de l'exécution précédente.",
  },
  migrations: {},
})
