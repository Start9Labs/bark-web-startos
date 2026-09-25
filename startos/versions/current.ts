import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.9.0:2',
  releaseNotes: {
    en_US:
      'Back Up Now no longer fails when uploading to a slow external target takes more than 30 seconds.',
    es_ES:
      'Back Up Now ya no falla cuando la subida a un destino externo lento tarda más de 30 segundos.',
    de_DE:
      'Back Up Now schlägt nicht mehr fehl, wenn das Hochladen zu einem langsamen externen Ziel länger als 30 Sekunden dauert.',
    pl_PL:
      'Back Up Now nie kończy się już błędem, gdy wysyłanie do wolnego celu zewnętrznego trwa dłużej niż 30 sekund.',
    fr_FR:
      "Back Up Now n'échoue plus lorsque l'envoi vers une cible externe lente prend plus de 30 secondes.",
  },
  migrations: {},
})
