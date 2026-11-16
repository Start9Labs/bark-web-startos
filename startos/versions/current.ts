import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.11.0:1',
  releaseNotes: {
    en_US:
      'A restore skips an empty or damaged backup copy instead of loading it, and tries again on the next start until a copy loads. Back Up Now no longer replaces good backups with a database that holds no wallet.',
    es_ES:
      'La restauración omite una copia de seguridad vacía o dañada en lugar de cargarla, y vuelve a intentarlo en el siguiente arranque hasta cargar una copia. Hacer copia ahora ya no reemplaza copias válidas con una base de datos sin monedero.',
    de_DE:
      'Eine Wiederherstellung überspringt eine leere oder beschädigte Sicherungskopie, statt sie zu laden, und versucht es beim nächsten Start erneut, bis eine Kopie geladen ist. Jetzt sichern ersetzt gültige Sicherungen nicht mehr durch eine Datenbank ohne Wallet.',
    pl_PL:
      'Przywracanie pomija pustą lub uszkodzoną kopię zapasową zamiast ją wczytać i ponawia próbę przy następnym uruchomieniu, aż kopia się wczyta. Utwórz kopię teraz nie zastępuje już poprawnych kopii bazą danych bez portfela.',
    fr_FR:
      "Une restauration ignore une copie de sauvegarde vide ou endommagée au lieu de la charger, et réessaie au démarrage suivant jusqu'à ce qu'une copie se charge. Sauvegarder maintenant ne remplace plus les sauvegardes valides par une base de données sans portefeuille.",
  },
  migrations: {},
})
