import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.8.1:0',
  releaseNotes: {
    en_US: `Updates Bark to bark-web 0.8.1.

• Refresh now submits every spendable VTXO, and the VTXO table shows each one's real round phase — queued or refreshing — rather than guessing at it.
• A round that failed, was canceled, or errored no longer leaves the Refresh buttons stuck.
• On a phone: the setup screens fit small displays, drawers keep their header and footer in place while the body scrolls and stay clear of the on-screen keyboard, and the QR scanner shows a loading overlay while the camera starts.

Full details: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.8.1/CHANGELOG.md`,
    es_ES: `Actualiza Bark a bark-web 0.8.1.

• La renovación ahora envía todos los VTXO gastables, y la tabla de VTXO muestra la fase real de la ronda de cada uno —en cola o renovándose— en lugar de deducirla.
• Una ronda fallida, cancelada o con error ya no deja bloqueados los botones de renovación.
• En el móvil: las pantallas de configuración se adaptan a pantallas pequeñas, los paneles mantienen fijos su encabezado y pie mientras el cuerpo se desplaza y evitan el teclado en pantalla, y el escáner QR muestra una capa de carga mientras arranca la cámara.

Detalles completos: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.8.1/CHANGELOG.md`,
    de_DE: `Aktualisiert Bark auf bark-web 0.8.1.

• Die Auffrischung reicht jetzt alle ausgabefähigen VTXOs ein, und die VTXO-Tabelle zeigt die tatsächliche Rundenphase — in Warteschlange oder wird aufgefrischt — statt sie zu erraten.
• Eine fehlgeschlagene, abgebrochene oder mit Fehler beendete Runde blockiert die Auffrischen-Schaltflächen nicht mehr.
• Auf dem Handy: Die Einrichtungsbildschirme passen auf kleine Displays, Drawer halten Kopf- und Fußzeile fest, während nur der Inhalt scrollt, und weichen der Bildschirmtastatur aus; der QR-Scanner zeigt eine Ladeanzeige, während die Kamera startet.

Vollständige Details: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.8.1/CHANGELOG.md`,
    pl_PL: `Aktualizuje Bark do bark-web 0.8.1.

• Odświeżanie wysyła teraz wszystkie zdatne do wydania VTXO, a tabela VTXO pokazuje rzeczywistą fazę rundy — w kolejce lub odświeżanie — zamiast ją zgadywać.
• Runda nieudana, anulowana lub zakończona błędem nie blokuje już przycisków odświeżania.
• Na telefonie: ekrany konfiguracji mieszczą się na małych wyświetlaczach, panele zachowują nagłówek i stopkę na miejscu podczas przewijania treści i omijają klawiaturę ekranową, a skaner QR pokazuje nakładkę ładowania podczas uruchamiania aparatu.

Pełne szczegóły: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.8.1/CHANGELOG.md`,
    fr_FR: `Met à jour Bark vers bark-web 0.8.1.

• Le rafraîchissement soumet désormais tous les VTXO dépensables, et le tableau des VTXO affiche la phase réelle du tour — en file d'attente ou en cours — au lieu de la déduire.
• Un tour ayant échoué, été annulé ou terminé en erreur ne bloque plus les boutons de rafraîchissement.
• Sur mobile : les écrans de configuration s'adaptent aux petits écrans, les panneaux gardent leur en-tête et leur pied de page fixes pendant que le corps défile et évitent le clavier virtuel, et le scanner QR affiche une superposition de chargement pendant le démarrage de la caméra.

Détails complets : https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.8.1/CHANGELOG.md`,
  },
  migrations: {},
})
