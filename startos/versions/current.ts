import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.9.0:0',
  releaseNotes: {
    en_US: `Updates Bark Wallet to bark-web 0.9.0 and barkd 0.7.1.

• Adds a Branta verification privacy setting and lists spent VTXOs in the VTXO table.
• Refresh is tracked per VTXO, and barkd locks a delegated refresh's inputs once its round begins so another payment cannot select them.
• Emergency exits use barkd's fee estimate, failed-round movements show zero amounts and fees, and relative times follow the wallet's language.

Full details: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.9.0/CHANGELOG.md`,
    es_ES: `Actualiza Bark Wallet a bark-web 0.9.0 y barkd 0.7.1.

• Añade una opción de privacidad para la verificación de Branta y muestra los VTXO gastados en la tabla de VTXO.
• La renovación se controla por VTXO, y barkd bloquea las entradas de una renovación delegada cuando comienza su ronda para que otro pago no pueda seleccionarlas.
• Las salidas de emergencia usan la estimación de comisiones de barkd, los movimientos de rondas fallidas muestran importes y comisiones de cero, y los tiempos relativos siguen el idioma de la cartera.

Detalles completos: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.9.0/CHANGELOG.md`,
    de_DE: `Aktualisiert Bark Wallet auf bark-web 0.9.0 und barkd 0.7.1.

• Fügt eine Datenschutzeinstellung für die Branta-Prüfung hinzu und zeigt ausgegebene VTXOs in der VTXO-Tabelle an.
• Die Auffrischung wird pro VTXO verfolgt, und barkd sperrt die Eingaben einer delegierten Auffrischung, sobald ihre Runde beginnt, damit sie nicht für eine andere Zahlung ausgewählt werden.
• Notausstiege verwenden die Gebührenschätzung von barkd, Bewegungen aus fehlgeschlagenen Runden zeigen Betrag und Gebühr als null an, und relative Zeiten folgen der Sprache der Wallet.

Vollständige Details: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.9.0/CHANGELOG.md`,
    pl_PL: `Aktualizuje Bark Wallet do bark-web 0.9.0 i barkd 0.7.1.

• Dodaje ustawienie prywatności weryfikacji Branta i pokazuje wydane VTXO w tabeli VTXO.
• Odświeżanie jest śledzone osobno dla każdego VTXO, a barkd blokuje wejścia delegowanego odświeżania po rozpoczęciu rundy, aby nie mogły zostać wybrane do innej płatności.
• Wyjścia awaryjne korzystają z oszacowania opłaty barkd, ruchy z nieudanych rund pokazują zerowe kwoty i opłaty, a czasy względne są zgodne z językiem portfela.

Pełne szczegóły: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.9.0/CHANGELOG.md`,
    fr_FR: `Met à jour Bark Wallet vers bark-web 0.9.0 et barkd 0.7.1.

• Ajoute un réglage de confidentialité pour la vérification Branta et affiche les VTXO dépensés dans le tableau des VTXO.
• Le rafraîchissement est suivi par VTXO, et barkd verrouille les entrées d'un rafraîchissement délégué dès le début de son tour afin qu'un autre paiement ne puisse pas les sélectionner.
• Les sorties d'urgence utilisent l'estimation des frais de barkd, les mouvements des tours échoués affichent des montants et frais nuls, et les durées relatives suivent la langue du portefeuille.

Détails complets : https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.9.0/CHANGELOG.md`,
  },
  migrations: {},
})
