import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.11.0:2',
  releaseNotes: {
    en_US:
      'A restore no longer gets stuck when a backup target serves a malformed copy.',
    es_ES:
      'Una restauración ya no se queda atascada cuando un destino de copia sirve una copia malformada.',
    de_DE:
      'Eine Wiederherstellung bleibt nicht mehr hängen, wenn ein Sicherungsziel eine fehlerhafte Kopie liefert.',
    pl_PL:
      'Przywracanie nie zawiesza się już, gdy cel kopii udostępnia uszkodzoną kopię.',
    fr_FR:
      "Une restauration ne reste plus bloquée lorsqu'une cible de sauvegarde fournit une copie malformée.",
  },
  migrations: {},
})
