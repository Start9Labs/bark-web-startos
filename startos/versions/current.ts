import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.12.0:0',
  releaseNotes: {
    en_US: `Updates Bark Web to 0.12.0 and the wallet daemon to 0.9.0.

- A Lightning send counts as sent only once the payment settles; a failed payment now shows an error instead of closing as sent.
- New boards expire after 3 days by default, instead of the server's full VTXO lifetime.
- Payments with an output below 330 sats keep working with upgraded Ark servers, which refuse the old payment format.
- Fixes a security issue in round participation, and force-exited VTXOs and confirmed exit transactions are now detected without a restart.

Full notes: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.12.0/CHANGELOG.md • https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.9.0`,
    es_ES: `Actualiza Bark Web a 0.12.0 y el demonio del monedero a 0.9.0.

- Un envío Lightning cuenta como enviado solo cuando el pago se liquida; un pago fallido muestra ahora un error en lugar de cerrarse como enviado.
- Los nuevos boards caducan por defecto a los 3 días, en lugar de durar toda la vida de VTXO del servidor.
- Los pagos con una salida inferior a 330 sats siguen funcionando con los servidores Ark actualizados, que rechazan el formato de pago antiguo.
- Corrige un problema de seguridad en la participación en rondas, y los VTXO con salida forzada y las transacciones de salida confirmadas se detectan ahora sin reiniciar.

Notas completas: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.12.0/CHANGELOG.md • https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.9.0`,
    de_DE: `Aktualisiert Bark Web auf 0.12.0 und den Wallet-Daemon auf 0.9.0.

- Eine Lightning-Zahlung gilt erst als gesendet, wenn sie abgeschlossen ist; eine fehlgeschlagene Zahlung zeigt jetzt einen Fehler, statt als gesendet zu schließen.
- Neue Boards laufen standardmäßig nach 3 Tagen ab statt nach der vollen VTXO-Laufzeit des Servers.
- Zahlungen mit einem Ausgang unter 330 Sats funktionieren weiterhin mit aktualisierten Ark-Servern, die das alte Zahlungsformat ablehnen.
- Behebt ein Sicherheitsproblem bei der Rundenteilnahme; zwangsweise beendete VTXOs und bestätigte Exit-Transaktionen werden jetzt ohne Neustart erkannt.

Vollständige Hinweise: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.12.0/CHANGELOG.md • https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.9.0`,
    pl_PL: `Aktualizuje Bark Web do 0.12.0 i demona portfela do 0.9.0.

- Płatność Lightning jest uznawana za wysłaną dopiero po rozliczeniu; nieudana płatność pokazuje teraz błąd zamiast zamykać się jako wysłana.
- Nowe boardy wygasają domyślnie po 3 dniach zamiast po pełnym czasie życia VTXO serwera.
- Płatności z wyjściem poniżej 330 satów nadal działają z zaktualizowanymi serwerami Ark, które odrzucają stary format płatności.
- Naprawia problem bezpieczeństwa w udziale w rundach, a wymuszenie wyjścia VTXO i potwierdzone transakcje wyjścia są teraz wykrywane bez restartu.

Pełne informacje: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.12.0/CHANGELOG.md • https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.9.0`,
    fr_FR: `Met à jour Bark Web vers 0.12.0 et le démon du portefeuille vers 0.9.0.

- Un envoi Lightning n'est considéré comme envoyé qu'une fois le paiement réglé ; un paiement échoué affiche désormais une erreur au lieu de se fermer comme envoyé.
- Les nouveaux boards expirent par défaut après 3 jours, au lieu de la durée de vie VTXO complète du serveur.
- Les paiements avec une sortie inférieure à 330 sats continuent de fonctionner avec les serveurs Ark mis à jour, qui refusent l'ancien format de paiement.
- Corrige un problème de sécurité dans la participation aux rounds ; les VTXO sortis de force et les transactions de sortie confirmées sont désormais détectés sans redémarrage.

Notes complètes : https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.12.0/CHANGELOG.md • https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.9.0`,
  },
  migrations: {},
})
