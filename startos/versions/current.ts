import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.11.0:0',
  releaseNotes: {
    en_US: `Updates Bark Web to 0.11.0 and the wallet daemon to 0.8.1. Requires StartOS 0.4.2 or newer.

- Fixes wallet creation when the recovery phrase repeats a word, duplicate payments from double-clicking Send, and an emergency-exit button that stayed disabled after failure.
- Paid Lightning sends no longer remain pending.
- Branta's removed “Loose privacy” mode switches to “Strict privacy”.
- Backup security fixes include rejecting HTTPS-to-HTTP redirects. If a Nextcloud backup stops for this reason, set its final HTTPS address in Configure Continuous Backups.

Full notes: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.11.0/CHANGELOG.md • https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.8.1 • https://rclone.org/changelog/#v1-76-0-2026-11-06`,
    es_ES: `Actualiza Bark Web a 0.11.0 y el demonio del monedero a 0.8.1. Requiere StartOS 0.4.2 o posterior.

- Corrige la creación del monedero cuando la frase de recuperación repite una palabra, los pagos duplicados al hacer doble clic en Enviar y un botón de salida de emergencia que quedaba deshabilitado tras un fallo.
- Los envíos Lightning pagados ya no permanecen pendientes.
- El modo eliminado «Privacidad flexible» de Branta cambia a «Privacidad estricta».
- Las correcciones de seguridad de las copias de seguridad incluyen rechazar redirecciones de HTTPS a HTTP. Si una copia en Nextcloud se detiene por este motivo, establece su dirección HTTPS final en Configurar copias de seguridad continuas.

Notas completas: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.11.0/CHANGELOG.md • https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.8.1 • https://rclone.org/changelog/#v1-76-0-2026-11-06`,
    de_DE: `Aktualisiert Bark Web auf 0.11.0 und den Wallet-Daemon auf 0.8.1. Erfordert StartOS 0.4.2 oder neuer.

- Behebt die Wallet-Erstellung bei wiederholten Wörtern in der Wiederherstellungsphrase, doppelte Zahlungen durch Doppelklick auf Senden und eine nach einem Fehler deaktiviert bleibende Notausstieg-Schaltfläche.
- Bezahlte Lightning-Sendungen bleiben nicht mehr ausstehend.
- Brantas entfernter Modus „Lockere Privatsphäre“ wechselt zu „Strenge Privatsphäre“.
- Sicherheitskorrekturen für Backups umfassen das Ablehnen von HTTPS-zu-HTTP-Weiterleitungen. Stoppt ein Nextcloud-Backup deswegen, dessen endgültige HTTPS-Adresse unter Kontinuierliche Backups konfigurieren eintragen.

Vollständige Hinweise: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.11.0/CHANGELOG.md • https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.8.1 • https://rclone.org/changelog/#v1-76-0-2026-11-06`,
    pl_PL: `Aktualizuje Bark Web do 0.11.0 i demona portfela do 0.8.1. Wymaga StartOS 0.4.2 lub nowszego.

- Naprawia tworzenie portfela, gdy fraza odzyskiwania zawiera powtórzone słowo, podwójne płatności po dwukrotnym kliknięciu Wyślij oraz przycisk wyjścia awaryjnego pozostający nieaktywny po błędzie.
- Opłacone wysyłki Lightning nie pozostają już oczekujące.
- Usunięty tryb Branta „Luźna prywatność” przechodzi na „Ścisłą prywatność”.
- Poprawki bezpieczeństwa kopii zapasowych obejmują odrzucanie przekierowań z HTTPS do HTTP. Jeśli kopia w Nextcloud zatrzyma się z tego powodu, ustaw jej końcowy adres HTTPS w Konfiguruj ciągłe kopie zapasowe.

Pełne informacje: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.11.0/CHANGELOG.md • https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.8.1 • https://rclone.org/changelog/#v1-76-0-2026-11-06`,
    fr_FR: `Met à jour Bark Web vers 0.11.0 et le démon du portefeuille vers 0.8.1. Nécessite StartOS 0.4.2 ou ultérieur.

- Corrige la création du portefeuille lorsque la phrase de récupération répète un mot, les paiements en double après un double clic sur Envoyer et un bouton de sortie d'urgence restant désactivé après un échec.
- Les envois Lightning payés ne restent plus en attente.
- Le mode Branta supprimé « Confidentialité souple » passe à « Confidentialité stricte ».
- Les correctifs de sécurité des sauvegardes incluent le rejet des redirections HTTPS vers HTTP. Si une sauvegarde Nextcloud s'arrête pour cette raison, renseignez son adresse HTTPS finale dans Configurer les sauvegardes continues.

Notes complètes : https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.11.0/CHANGELOG.md • https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.8.1 • https://rclone.org/changelog/#v1-76-0-2026-11-06`,
  },
  migrations: {},
})
