import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.6.0:0',
  releaseNotes: {
    en_US: `Updates bark-web to v0.6.0 and the wallet daemon to bark v0.6.0. Recommended for everyone.

• Security: earlier versions served your twelve-word recovery phrase to anything that could reach the wallet daemon's API. Upstream has closed that off, and this release picks up the fix. Reading your phrase in Settings still works as before.
• Your recovery phrase can now rebuild your Ark balance on its own. On opening a wallet, Bark restores your spendable balance from a recovery mailbox held by the Ark server. It is a best-effort repair — it needs the server, skips anything already spent or exited, and reports what it cannot check — so keep your backup current; this is a safety net, not a replacement.
• Offboards now show a fee estimate before you confirm.

Full changelog: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.6.0/CHANGELOG.md`,
    es_ES: `Actualiza bark-web a v0.6.0 y el demonio del monedero a bark v0.6.0. Recomendado para todos.

• Seguridad: las versiones anteriores entregaban tu frase de recuperación de doce palabras a cualquier cosa que pudiera alcanzar la API del demonio del monedero. Upstream lo ha cerrado y esta versión incorpora la corrección. Ver tu frase en Ajustes sigue funcionando igual.
• Tu frase de recuperación ya puede reconstruir tu saldo de Ark por sí sola. Al abrir el monedero, Bark restaura tu saldo disponible desde un buzón de recuperación alojado en el servidor Ark. Es una reparación de mejor esfuerzo — necesita el servidor, omite lo ya gastado o salido, e informa de lo que no puede comprobar — así que mantén tu copia de seguridad al día; esto es una red de seguridad, no un sustituto.
• Los offboards ahora muestran una estimación de comisión antes de confirmar.

Registro de cambios completo: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.6.0/CHANGELOG.md`,
    de_DE: `Aktualisiert bark-web auf v0.6.0 und den Wallet-Daemon auf bark v0.6.0. Für alle empfohlen.

• Sicherheit: Frühere Versionen gaben deine zwölf Wörter umfassende Wiederherstellungsphrase an alles heraus, was die API des Wallet-Daemons erreichen konnte. Upstream hat das geschlossen, und diese Version übernimmt die Korrektur. Das Anzeigen deiner Phrase in den Einstellungen funktioniert wie bisher.
• Deine Wiederherstellungsphrase kann dein Ark-Guthaben jetzt allein wiederherstellen. Beim Öffnen des Wallets stellt Bark dein verfügbares Guthaben aus einem Wiederherstellungspostfach des Ark-Servers wieder her. Es ist eine Best-Effort-Reparatur — sie benötigt den Server, überspringt bereits Ausgegebenes oder Ausgestiegenes und meldet, was sie nicht prüfen kann — halte deine Sicherung also aktuell; dies ist ein Sicherheitsnetz, kein Ersatz.
• Offboards zeigen jetzt vor dem Bestätigen eine Gebührenschätzung.

Vollständiges Änderungsprotokoll: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.6.0/CHANGELOG.md`,
    pl_PL: `Aktualizuje bark-web do v0.6.0, a demona portfela do bark v0.6.0. Zalecane dla wszystkich.

• Bezpieczeństwo: wcześniejsze wersje udostępniały Twoją dwunastowyrazową frazę odzyskiwania wszystkiemu, co mogło sięgnąć API demona portfela. Upstream to zamknął, a ta wersja przejmuje poprawkę. Podgląd frazy w Ustawieniach działa jak dotychczas.
• Twoja fraza odzyskiwania może teraz samodzielnie odbudować saldo Ark. Przy otwarciu portfela Bark odtwarza dostępne saldo ze skrzynki odzyskiwania utrzymywanej przez serwer Ark. To naprawa best-effort — wymaga serwera, pomija to, co już wydane lub wyprowadzone, i zgłasza to, czego nie może sprawdzić — więc utrzymuj aktualną kopię zapasową; to zabezpieczenie, nie zamiennik.
• Offboardy pokazują teraz szacunkową opłatę przed potwierdzeniem.

Pełny dziennik zmian: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.6.0/CHANGELOG.md`,
    fr_FR: `Met à jour bark-web vers v0.6.0 et le démon du portefeuille vers bark v0.6.0. Recommandé pour tous.

• Sécurité : les versions précédentes livraient votre phrase de récupération de douze mots à tout ce qui pouvait atteindre l'API du démon du portefeuille. L'amont a fermé cet accès et cette version reprend le correctif. Consulter votre phrase dans les Paramètres fonctionne comme avant.
• Votre phrase de récupération peut désormais reconstituer votre solde Ark à elle seule. À l'ouverture du portefeuille, Bark restaure votre solde disponible depuis une boîte de récupération hébergée par le serveur Ark. C'est une réparation au mieux — elle nécessite le serveur, ignore ce qui est déjà dépensé ou sorti, et signale ce qu'elle ne peut pas vérifier — gardez donc votre sauvegarde à jour ; c'est un filet de sécurité, pas un remplacement.
• Les offboards affichent maintenant une estimation de frais avant confirmation.

Journal des modifications complet : https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.6.0/CHANGELOG.md`,
  },
  migrations: {},
})
