import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.11.0:1',
  releaseNotes: {
    en_US:
      'A restore skips empty or damaged backup copies without falling back past its saved freshness limit, and tries again on the next start until a usable copy loads. Back Up Now no longer replaces good backups with a database that holds no wallet.',
    es_ES:
      'La restauración omite las copias de seguridad vacías o dañadas sin retroceder más allá del límite de actualidad guardado, y vuelve a intentarlo en el siguiente arranque hasta cargar una copia utilizable. Hacer copia ahora ya no reemplaza copias válidas con una base de datos sin monedero.',
    de_DE:
      'Eine Wiederherstellung überspringt leere oder beschädigte Sicherungskopien, ohne hinter den gespeicherten Aktualitätsstand zurückzufallen, und versucht es beim nächsten Start erneut, bis eine verwendbare Kopie geladen ist. Jetzt sichern ersetzt gültige Sicherungen nicht mehr durch eine Datenbank ohne Wallet.',
    pl_PL:
      'Przywracanie pomija puste lub uszkodzone kopie zapasowe bez cofania się poniżej zapisanego progu aktualności i ponawia próbę przy następnym uruchomieniu, aż wczyta użyteczną kopię. Utwórz kopię teraz nie zastępuje już poprawnych kopii bazą danych bez portfela.',
    fr_FR:
      "Une restauration ignore les copies de sauvegarde vides ou endommagées sans revenir en deçà de la limite de fraîcheur enregistrée, et réessaie au démarrage suivant jusqu'à ce qu'une copie utilisable soit chargée. Sauvegarder maintenant ne remplace plus les sauvegardes valides par une base de données sans portefeuille.",
  },
  migrations: {},
})
