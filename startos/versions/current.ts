import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.9.0:3',
  releaseNotes: {
    en_US: `Back Up Now no longer fails when uploading to a slow external target takes more than 30 seconds.

• The actions, their forms and results, the setup tasks and the Continuous Backup health check are translated into Spanish, German, Polish and French.
• Set UI Password asks for confirmation before it replaces an existing password, and Back Up Now asks before it runs.
• Configure Continuous Backups explains its SFTP authentication options and which Dropbox code to paste, and its result names each enabled target.
• Backup Safety tells you to record your recovery phrase when the wallet shows it during setup.`,
    es_ES: `Back Up Now ya no falla cuando la subida a un destino externo lento tarda más de 30 segundos.

• Las acciones, sus formularios y resultados, las tareas de configuración y la comprobación de estado «Copia continua» están traducidos al español, alemán, polaco y francés.
• Establecer contraseña de la interfaz pide confirmación antes de sustituir una contraseña existente, y Hacer copia ahora la pide antes de ejecutarse.
• Configurar copias continuas explica sus opciones de autenticación SFTP y qué código de Dropbox hay que pegar, y su resultado nombra cada destino habilitado.
• Seguridad de las copias te indica que anotes tu frase de recuperación cuando el monedero te la muestre durante la configuración.`,
    de_DE: `Back Up Now schlägt nicht mehr fehl, wenn das Hochladen zu einem langsamen externen Ziel länger als 30 Sekunden dauert.

• Die Aktionen, ihre Formulare und Ergebnisse, die Einrichtungsaufgaben und die Zustandsprüfung „Kontinuierliches Backup“ sind ins Spanische, Deutsche, Polnische und Französische übersetzt.
• UI-Passwort festlegen fragt nach einer Bestätigung, bevor ein vorhandenes Passwort ersetzt wird, und Jetzt sichern fragt, bevor es ausgeführt wird.
• Kontinuierliche Backups konfigurieren erklärt die SFTP-Anmeldeoptionen und welcher Dropbox-Code einzufügen ist, und das Ergebnis nennt jedes aktivierte Ziel.
• Backup-Sicherheit fordert dich auf, deine Wiederherstellungsphrase zu notieren, wenn die Wallet sie bei der Einrichtung anzeigt.`,
    pl_PL: `Back Up Now nie kończy się już błędem, gdy wysyłanie do wolnego celu zewnętrznego trwa dłużej niż 30 sekund.

• Akcje, ich formularze i wyniki, zadania konfiguracyjne oraz kontrola stanu „Kopia ciągła” są przetłumaczone na hiszpański, niemiecki, polski i francuski.
• Ustaw hasło interfejsu prosi o potwierdzenie przed zastąpieniem istniejącego hasła, a Utwórz kopię teraz — przed uruchomieniem.
• Skonfiguruj kopie ciągłe wyjaśnia opcje uwierzytelniania SFTP i to, który kod Dropbox wkleić, a jego wynik wymienia każdy włączony cel.
• Bezpieczeństwo kopii przypomina, aby zapisać frazę odzyskiwania, gdy portfel pokaże ją podczas konfiguracji.`,
    fr_FR: `Back Up Now n'échoue plus lorsque l'envoi vers une cible externe lente prend plus de 30 secondes.

• Les actions, leurs formulaires et résultats, les tâches de configuration et le contrôle « Sauvegarde continue » sont traduits en espagnol, allemand, polonais et français.
• Définir le mot de passe de l'interface demande une confirmation avant de remplacer un mot de passe existant, et Sauvegarder maintenant avant de s'exécuter.
• Configurer les sauvegardes continues explique ses options d'authentification SFTP et quel code Dropbox coller, et son résultat nomme chaque cible activée.
• Sécurité des sauvegardes vous invite à noter votre phrase de récupération lorsque le portefeuille l'affiche pendant la configuration.`,
  },
  migrations: {},
})
