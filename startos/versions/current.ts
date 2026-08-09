import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.7.2:0',
  releaseNotes: {
    en_US: `Updates bark-web to v0.7.2 and the wallet daemon to bark v0.6.1. A bugfix and security release, recommended for everyone.

• Sending no longer reports "insufficient funds" while an earlier send is still going through.
• On-chain sends could fail when your wallet and the Ark server priced the same coins in a different order. Both sides now calculate the fee the same way.
• Refreshes that were scheduled before v0.6.0 could not be completed; they now finish normally.
• Revealing your recovery phrase now goes through a dedicated endpoint that requires you to be logged in, and the wallet daemon's recovery-phrase route is no longer reachable through the app's proxy.

Full changelog: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.7.2/CHANGELOG.md`,
    es_ES: `Actualiza bark-web a v0.7.2 y el demonio del monedero a bark v0.6.1. Una versión de correcciones y seguridad, recomendada para todos.

• Al enviar ya no aparece «fondos insuficientes» mientras un envío anterior sigue en curso.
• Los envíos en cadena podían fallar cuando tu monedero y el servidor Ark valoraban las mismas monedas en distinto orden. Ahora ambos calculan la comisión de la misma manera.
• Las renovaciones programadas antes de v0.6.0 no podían completarse; ahora finalizan con normalidad.
• Mostrar tu frase de recuperación ahora pasa por un punto de acceso específico que exige haber iniciado sesión, y la ruta de la frase de recuperación del demonio ya no es accesible a través del proxy de la aplicación.

Registro de cambios completo: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.7.2/CHANGELOG.md`,
    de_DE: `Aktualisiert bark-web auf v0.7.2 und den Wallet-Daemon auf bark v0.6.1. Eine Fehlerbehebungs- und Sicherheitsversion, für alle empfohlen.

• Beim Senden erscheint nicht mehr „unzureichendes Guthaben“, während eine frühere Sendung noch läuft.
• On-Chain-Sendungen konnten fehlschlagen, wenn dein Wallet und der Ark-Server dieselben Coins in unterschiedlicher Reihenfolge bepreisten. Beide Seiten berechnen die Gebühr jetzt gleich.
• Vor v0.6.0 geplante Auffrischungen ließen sich nicht abschließen; sie werden jetzt normal beendet.
• Das Anzeigen deiner Wiederherstellungsphrase läuft jetzt über einen eigenen Endpunkt, der eine Anmeldung voraussetzt, und die Wiederherstellungsphrasen-Route des Daemons ist über den Proxy der App nicht mehr erreichbar.

Vollständiges Änderungsprotokoll: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.7.2/CHANGELOG.md`,
    pl_PL: `Aktualizuje bark-web do v0.7.2, a demona portfela do bark v0.6.1. Wydanie z poprawkami i ulepszeniami bezpieczeństwa, zalecane dla wszystkich.

• Podczas wysyłki nie pojawia się już komunikat o niewystarczających środkach, gdy wcześniejsza wysyłka jest wciąż w toku.
• Wysyłki on-chain mogły się nie powieść, gdy Twój portfel i serwer Ark wyceniały te same monety w innej kolejności. Obie strony liczą teraz opłatę tak samo.
• Odświeżenia zaplanowane przed v0.6.0 nie mogły zostać ukończone; teraz kończą się normalnie.
• Ujawnienie frazy odzyskiwania odbywa się teraz przez dedykowany punkt końcowy wymagający zalogowania, a trasa frazy odzyskiwania w demonie nie jest już dostępna przez proxy aplikacji.

Pełny dziennik zmian: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.7.2/CHANGELOG.md`,
    fr_FR: `Met à jour bark-web vers v0.7.2 et le démon du portefeuille vers bark v0.6.1. Une version de correctifs et de sécurité, recommandée pour tous.

• L'envoi n'indique plus « fonds insuffisants » tant qu'un envoi précédent est encore en cours.
• Les envois on-chain pouvaient échouer lorsque votre portefeuille et le serveur Ark valorisaient les mêmes pièces dans un ordre différent. Les deux calculent désormais les frais de la même façon.
• Les rafraîchissements programmés avant la v0.6.0 ne pouvaient pas aboutir ; ils se terminent maintenant normalement.
• L'affichage de votre phrase de récupération passe désormais par un point d'accès dédié qui exige d'être connecté, et la route de la phrase de récupération du démon n'est plus accessible via le proxy de l'application.

Journal des modifications complet : https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.7.2/CHANGELOG.md`,
  },
  migrations: {},
})
