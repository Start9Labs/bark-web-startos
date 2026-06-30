import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.3.0:0',
  releaseNotes: {
    en_US: `Updated Bark to 0.3.0 (wallet daemon and web GUI).

- Unilateral exits no longer lock a VTXO until the exit transaction is actually broadcast, so queued funds stay spendable and the exit cancels itself cleanly if they are spent elsewhere.
- Automatic detection and recovery of force-exited VTXOs during sync; Lightning-received VTXOs are now protected from force-exit.
- Adds LNURL-pay support, plus GUI additions: a dedicated VTXO page, a fiat/bitcoin unit toggle on amount entry, and barkd log export.

⚠️ Do not upgrade if you have an in-progress emergency exit on mainnet — finish it first.

Full notes: https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.3.0`,
    es_ES: `Actualiza Bark a 0.3.0 (demonio del monedero e interfaz web).

- Las salidas unilaterales ya no bloquean un VTXO hasta que la transacción de salida se transmite realmente, así que los fondos en cola siguen siendo gastables y la salida se cancela sola si se gastan en otro lugar.
- Detección y recuperación automática de VTXO con salida forzada durante la sincronización; los VTXO recibidos por Lightning ahora están protegidos contra la salida forzada.
- Añade soporte de LNURL-pay, además de mejoras en la interfaz: una página dedicada de VTXO, alternancia entre unidad fiat/bitcoin al introducir importes y exportación de registros de barkd.

⚠️ No actualices si tienes una salida de emergencia en curso en mainnet — termínala primero.

Notas completas: https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.3.0`,
    de_DE: `Aktualisiert Bark auf 0.3.0 (Wallet-Daemon und Web-Oberfläche).

- Einseitige Exits sperren ein VTXO nicht mehr, bis die Exit-Transaktion tatsächlich gesendet wurde; in der Warteschlange stehende Mittel bleiben verfügbar, und der Exit bricht sauber ab, wenn sie anderweitig ausgegeben werden.
- Automatische Erkennung und Wiederherstellung zwangsweise ausgetretener VTXOs bei der Synchronisierung; über Lightning empfangene VTXOs sind nun vor Zwangsexit geschützt.
- Fügt LNURL-pay-Unterstützung hinzu sowie Oberflächen-Erweiterungen: eine eigene VTXO-Seite, das Umschalten zwischen Fiat- und Bitcoin-Einheit bei der Betragseingabe und den Export der barkd-Protokolle.

⚠️ Nicht aktualisieren, wenn ein Notfall-Exit im Mainnet läuft — schließen Sie ihn zuerst ab.

Vollständige Hinweise: https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.3.0`,
    pl_PL: `Aktualizuje Bark do 0.3.0 (demon portfela i interfejs webowy).

- Jednostronne wyjścia nie blokują już VTXO, dopóki transakcja wyjścia nie zostanie faktycznie rozgłoszona, więc środki w kolejce pozostają wydawalne, a wyjście samo się anuluje, jeśli zostaną wydane gdzie indziej.
- Automatyczne wykrywanie i odzyskiwanie wymuszonych wyjść VTXO podczas synchronizacji; VTXO otrzymane przez Lightning są teraz chronione przed wymuszonym wyjściem.
- Dodaje obsługę LNURL-pay oraz ulepszenia interfejsu: dedykowaną stronę VTXO, przełączanie jednostki fiat/bitcoin przy wpisywaniu kwoty i eksport logów barkd.

⚠️ Nie aktualizuj, jeśli masz trwające awaryjne wyjście na mainnecie — najpierw je zakończ.

Pełne informacje: https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.3.0`,
    fr_FR: `Met à jour Bark vers 0.3.0 (démon du portefeuille et interface web).

- Les sorties unilatérales ne verrouillent plus un VTXO tant que la transaction de sortie n'est pas réellement diffusée ; les fonds en file d'attente restent dépensables et la sortie s'annule proprement s'ils sont dépensés ailleurs.
- Détection et récupération automatiques des VTXO sortis de force lors de la synchronisation ; les VTXO reçus via Lightning sont désormais protégés contre la sortie forcée.
- Ajoute la prise en charge de LNURL-pay, ainsi que des améliorations de l'interface : une page VTXO dédiée, un basculement entre unité fiat et bitcoin lors de la saisie du montant, et l'export des journaux de barkd.

⚠️ Ne mettez pas à jour si une sortie d'urgence est en cours sur le mainnet — terminez-la d'abord.

Notes complètes : https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.3.0`,
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
