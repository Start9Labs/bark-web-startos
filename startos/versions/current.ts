import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { migrateBackupConfigV1 } from './migrateBackupV1'

export const current = VersionInfo.of({
  version: '0.3.0:1',
  releaseNotes: {
    en_US: `Internal updates (start-sdk 2.0.x), plus external wallet-backup improvements:
• Dropbox setup now gives the same guided browser link as Google Drive; authorization codes no longer need hand-editing.
• Nextcloud can back up to a LAN server with a self-signed certificate.
• SFTP targets that rejected setting file timestamps now upload correctly.
• The Wallet Backup health check names the failing target and reason, and no longer floods the logs.
• Entered target settings are saved even before you toggle Enabled, and passwords persist reliably across saves.`,
    es_ES: `Actualizaciones internas (start-sdk 2.0.x), además de mejoras en las copias de seguridad externas del monedero:
• La configuración de Dropbox ahora ofrece el mismo enlace guiado en el navegador que Google Drive; los códigos de autorización ya no necesitan edición manual.
• Nextcloud puede hacer copias en un servidor de la red local con certificado autofirmado.
• Los destinos SFTP que rechazaban fijar la fecha de los archivos ahora suben correctamente.
• La comprobación de estado «Copia del monedero» indica el destino y el motivo del fallo, y ya no satura los registros.
• Los ajustes introducidos se guardan aunque no hayas activado «Habilitado», y las contraseñas se conservan de forma fiable al guardar.`,
    de_DE: `Interne Aktualisierungen (start-sdk 2.0.x) sowie Verbesserungen der externen Wallet-Backups:
• Die Dropbox-Einrichtung bietet jetzt denselben geführten Browser-Link wie Google Drive; Autorisierungscodes müssen nicht mehr von Hand bearbeitet werden.
• Nextcloud kann auf einen LAN-Server mit selbstsigniertem Zertifikat sichern.
• SFTP-Ziele, die das Setzen des Datei-Zeitstempels ablehnten, laden nun korrekt hoch.
• Die Zustandsprüfung „Wallet-Backup“ nennt Ziel und Grund des Fehlers und flutet die Logs nicht mehr.
• Eingegebene Zieleinstellungen werden auch vor dem Aktivieren gespeichert, und Passwörter bleiben beim Speichern zuverlässig erhalten.`,
    pl_PL: `Aktualizacje wewnętrzne (start-sdk 2.0.x) oraz ulepszenia zewnętrznych kopii zapasowych portfela:
• Konfiguracja Dropbox udostępnia teraz taki sam prowadzony link w przeglądarce jak Google Drive; kody autoryzacji nie wymagają już ręcznej edycji.
• Nextcloud może tworzyć kopie na serwerze w sieci lokalnej z certyfikatem samopodpisanym.
• Cele SFTP, które odrzucały ustawianie znacznika czasu plików, teraz przesyłają poprawnie.
• Kontrola stanu „Kopia portfela“ podaje cel i przyczynę błędu i nie zalewa już logów.
• Wprowadzone ustawienia celu są zapisywane nawet przed włączeniem „Włączone“, a hasła są niezawodnie zachowywane przy zapisie.`,
    fr_FR: `Mises à jour internes (start-sdk 2.0.x), ainsi que des améliorations des sauvegardes externes du portefeuille :
• La configuration de Dropbox propose désormais le même lien guidé dans le navigateur que Google Drive ; les codes d'autorisation n'ont plus besoin d'être modifiés à la main.
• Nextcloud peut sauvegarder vers un serveur du réseau local avec un certificat auto-signé.
• Les cibles SFTP qui refusaient de définir l'horodatage des fichiers téléversent maintenant correctement.
• Le contrôle d'état « Sauvegarde du portefeuille » indique la cible et la raison de l'échec et n'inonde plus les journaux.
• Les paramètres saisis sont enregistrés même avant d'activer « Activé », et les mots de passe sont conservés de façon fiable à l'enregistrement.`,
  },
  migrations: {
    up: async ({ effects }) => {
      await migrateBackupConfigV1(effects)
    },
    down: IMPOSSIBLE,
  },
})
