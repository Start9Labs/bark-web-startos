import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.10.0:0',
  releaseNotes: {
    en_US: `Updates Bark Web to 0.10.0 with barkd 0.8.0 and rclone 1.75.2.

- The balance breakdown includes funds needing refresh and pending Ark sends and offboards. Swept exits appear as finished, and old on-chain transactions retain their place in history.
- Tags can be deleted from every transaction through the tag picker.
- Wallet recovery is faster and can recover completed delegated rounds. Interrupted round registration no longer strands locked VTXOs.
- Disables barkd's embedded UI to keep its bearer token out of startup logs; the password-protected web interface remains unchanged.

Full notes: https://gitlab.com/ark-bitcoin/bark-web/-/releases/v0.10.0 and https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.8.0`,
    es_ES: `Actualiza Bark Web a 0.10.0 con barkd 0.8.0 y rclone 1.75.2.

- El desglose del saldo incluye fondos que necesitan renovación y envíos Ark y salidas pendientes. Las salidas barridas aparecen como finalizadas y las transacciones antiguas en cadena conservan su lugar en el historial.
- El selector de etiquetas permite eliminar una etiqueta de todas las transacciones.
- La recuperación del monedero es más rápida y puede recuperar rondas delegadas completadas. Interrumpir el registro de una ronda ya no deja VTXO bloqueados.
- Desactiva la interfaz integrada de barkd para evitar que su token de acceso aparezca en los registros de inicio; la interfaz web protegida por contraseña no cambia.

Notas completas: https://gitlab.com/ark-bitcoin/bark-web/-/releases/v0.10.0 y https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.8.0`,
    de_DE: `Aktualisiert Bark Web auf 0.10.0 mit barkd 0.8.0 und rclone 1.75.2.

- Die Guthabenaufteilung enthält auffrischungsbedürftige Mittel sowie ausstehende Ark-Sendungen und Offboards. Abgeräumte Ausstiege erscheinen als abgeschlossen, und ältere On-Chain-Transaktionen behalten ihren Platz im Verlauf.
- Über die Tag-Auswahl lassen sich Tags aus allen Transaktionen löschen.
- Die Wallet-Wiederherstellung ist schneller und kann abgeschlossene delegierte Runden wiederherstellen. Eine unterbrochene Rundenregistrierung hinterlässt keine gesperrten VTXOs mehr.
- Deaktiviert die eingebettete Oberfläche von barkd, damit ihr Zugriffstoken nicht im Startprotokoll erscheint; die passwortgeschützte Weboberfläche bleibt unverändert.

Vollständige Hinweise: https://gitlab.com/ark-bitcoin/bark-web/-/releases/v0.10.0 und https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.8.0`,
    pl_PL: `Aktualizuje Bark Web do 0.10.0 z barkd 0.8.0 i rclone 1.75.2.

- Podział salda obejmuje środki wymagające odświeżenia oraz oczekujące wysyłki Ark i wypłaty offboard. Wyjścia przejęte przez serwer są oznaczone jako zakończone, a stare transakcje on-chain zachowują miejsce w historii.
- Selektor tagów pozwala usunąć tag ze wszystkich transakcji.
- Odzyskiwanie portfela jest szybsze i obejmuje ukończone rundy delegowane. Przerwanie rejestracji rundy nie pozostawia już zablokowanych VTXO.
- Wyłącza wbudowany interfejs barkd, aby token dostępu nie trafiał do dzienników uruchomienia; interfejs webowy chroniony hasłem pozostaje bez zmian.

Pełne informacje: https://gitlab.com/ark-bitcoin/bark-web/-/releases/v0.10.0 oraz https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.8.0`,
    fr_FR: `Met à jour Bark Web vers 0.10.0 avec barkd 0.8.0 et rclone 1.75.2.

- Le détail du solde inclut les fonds à rafraîchir ainsi que les envois Ark et les sorties offboard en attente. Les sorties balayées apparaissent comme terminées et les anciennes transactions on-chain gardent leur place dans l'historique.
- Le sélecteur d'étiquettes permet de supprimer une étiquette de toutes les transactions.
- La récupération du portefeuille est plus rapide et retrouve les tours délégués terminés. Une inscription interrompue à un tour ne laisse plus de VTXO verrouillés.
- Désactive l'interface intégrée de barkd pour éviter que son jeton d'accès apparaisse dans les journaux de démarrage ; l'interface web protégée par mot de passe reste inchangée.

Notes complètes : https://gitlab.com/ark-bitcoin/bark-web/-/releases/v0.10.0 et https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.8.0`,
  },
  migrations: {},
})
