import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.4.0:1',
  releaseNotes: {
    en_US: `Updates bark-web to v0.4.0 (barkd 0.4.0).

• Board — move your on-chain funds into your Ark balance, all at once or a chosen amount; boarding transactions are badged "On-chain: Board" in your movement history.
• barkd 0.4.0 makes on-chain sends and offboards crash-safe and resumable: an interrupted operation now recovers on the next wallet sync instead of being lost, and on-chain sends that produce change no longer fail.
• Kraken is now the default Bitcoin price source.

Full changelog: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.4.0/CHANGELOG.md`,
    es_ES: `Actualiza bark-web a v0.4.0 (barkd 0.4.0).

• Board — mueve tus fondos on-chain a tu saldo de Ark, de una vez o por una cantidad elegida; las transacciones de embarque aparecen etiquetadas como «On-chain: Board» en tu historial de movimientos.
• barkd 0.4.0 hace que los envíos on-chain y los offboards sean resistentes a fallos y reanudables: una operación interrumpida ahora se recupera en la siguiente sincronización del monedero en lugar de perderse, y los envíos on-chain que generan cambio ya no fallan.
• Kraken es ahora la fuente de precio de Bitcoin predeterminada.

Registro de cambios completo: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.4.0/CHANGELOG.md`,
    de_DE: `Aktualisiert bark-web auf v0.4.0 (barkd 0.4.0).

• Board — verschieben Sie Ihre On-Chain-Guthaben in Ihr Ark-Guthaben, auf einmal oder in einem gewählten Betrag; Board-Transaktionen sind im Bewegungsverlauf mit „On-chain: Board“ gekennzeichnet.
• barkd 0.4.0 macht On-Chain-Sendungen und Offboards absturzsicher und fortsetzbar: Ein unterbrochener Vorgang wird jetzt bei der nächsten Wallet-Synchronisierung wiederhergestellt, statt verloren zu gehen, und On-Chain-Sendungen mit Wechselgeld schlagen nicht mehr fehl.
• Kraken ist jetzt die Standardquelle für den Bitcoin-Preis.

Vollständiges Änderungsprotokoll: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.4.0/CHANGELOG.md`,
    pl_PL: `Aktualizuje bark-web do v0.4.0 (barkd 0.4.0).

• Board — przenieś swoje środki on-chain do salda Ark, w całości lub w wybranej kwocie; transakcje typu board są oznaczane etykietą „On-chain: Board” w historii ruchów.
• barkd 0.4.0 sprawia, że wysyłki on-chain i offboardy są odporne na awarie i wznawialne: przerwana operacja jest teraz odzyskiwana przy następnej synchronizacji portfela zamiast zostać utracona, a wysyłki on-chain generujące resztę już nie zawodzą.
• Kraken jest teraz domyślnym źródłem ceny Bitcoina.

Pełny dziennik zmian: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.4.0/CHANGELOG.md`,
    fr_FR: `Met à jour bark-web vers v0.4.0 (barkd 0.4.0).

• Board — transférez vos fonds on-chain vers votre solde Ark, en totalité ou pour un montant choisi ; les transactions d'embarquement sont étiquetées « On-chain: Board » dans votre historique de mouvements.
• barkd 0.4.0 rend les envois on-chain et les offboards résistants aux pannes et reprenables : une opération interrompue est désormais récupérée à la prochaine synchronisation du portefeuille au lieu d'être perdue, et les envois on-chain générant de la monnaie n'échouent plus.
• Kraken est désormais la source de prix Bitcoin par défaut.

Journal des modifications complet : https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.4.0/CHANGELOG.md`,
  },
  migrations: {},
})
