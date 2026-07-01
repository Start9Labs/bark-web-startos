import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.3.1:0',
  releaseNotes: {
    en_US: `Updated the Bark web GUI to 0.3.1 (wallet daemon unchanged at 0.3.0).

- Adds an opt-in login gate for the web interface.
- Fixes VTXO balances not refreshing after sending or receiving a payment.

Full notes: https://gitlab.com/ark-bitcoin/labs/bark-web/-/releases/v0.3.1`,
    es_ES: `Actualiza la interfaz web de Bark a 0.3.1 (el demonio del monedero se mantiene en 0.3.0).

- Añade una pantalla de inicio de sesión opcional para la interfaz web.
- Corrige que los saldos de VTXO no se actualizaban tras enviar o recibir un pago.

Notas completas: https://gitlab.com/ark-bitcoin/labs/bark-web/-/releases/v0.3.1`,
    de_DE: `Aktualisiert die Bark-Web-Oberfläche auf 0.3.1 (Wallet-Daemon unverändert bei 0.3.0).

- Fügt eine optionale Anmeldesperre für die Web-Oberfläche hinzu.
- Behebt, dass VTXO-Guthaben nach dem Senden oder Empfangen einer Zahlung nicht aktualisiert wurden.

Vollständige Hinweise: https://gitlab.com/ark-bitcoin/labs/bark-web/-/releases/v0.3.1`,
    pl_PL: `Aktualizuje interfejs webowy Bark do 0.3.1 (demon portfela pozostaje na 0.3.0).

- Dodaje opcjonalną bramkę logowania dla interfejsu webowego.
- Naprawia brak odświeżania sald VTXO po wysłaniu lub odebraniu płatności.

Pełne informacje: https://gitlab.com/ark-bitcoin/labs/bark-web/-/releases/v0.3.1`,
    fr_FR: `Met à jour l'interface web de Bark vers 0.3.1 (démon du portefeuille inchangé à 0.3.0).

- Ajoute une page de connexion optionnelle pour l'interface web.
- Corrige les soldes VTXO qui ne se rafraîchissaient pas après l'envoi ou la réception d'un paiement.

Notes complètes : https://gitlab.com/ark-bitcoin/labs/bark-web/-/releases/v0.3.1`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
