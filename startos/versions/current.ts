import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.7.2:1',
  releaseNotes: {
    en_US: `The wallet now syncs from your own Bitcoin node instead of a third-party block explorer.

• Bitcoin is now a required dependency, and chain data — balances, transaction status, fee estimates, broadcasts — comes from it over RPC. Previously the wallet read the chain from a hosted explorer (mempool.second.tech), which meant trusting someone else's view of Bitcoin and, in a chain split, following their consensus rules rather than the ones you chose to run.
• Existing wallets move over automatically on first start; your balance, VTXOs, and history are untouched.
• Your node must be archival (pruning disabled) — Bitcoin only exposes RPC to other services when it is. StartOS will prompt you if pruning is on.
• Bitcoin 29.0 or later is required. Below that, the wallet can join Ark rounds but cannot unilaterally exit.

The Ark server (ark.second.tech) is unchanged — Ark is a two-party protocol and the server is inherent to it.`,
    es_ES: `El monedero ahora se sincroniza con tu propio nodo de Bitcoin en lugar de un explorador de bloques de terceros.

• Bitcoin es ahora una dependencia obligatoria, y los datos de la cadena —saldos, estado de transacciones, estimaciones de comisiones, difusiones— provienen de él mediante RPC. Antes el monedero leía la cadena desde un explorador alojado (mempool.second.tech), lo que implicaba confiar en la visión de Bitcoin de otra persona y, en una división de cadena, seguir sus reglas de consenso en lugar de las que tú elegiste ejecutar.
• Los monederos existentes se migran automáticamente en el primer inicio; tu saldo, VTXOs e historial permanecen intactos.
• Tu nodo debe ser de archivo (poda desactivada) — Bitcoin solo expone RPC a otros servicios en ese caso. StartOS te avisará si la poda está activada.
• Se requiere Bitcoin 29.0 o posterior. Por debajo de esa versión, el monedero puede participar en rondas Ark pero no puede salir unilateralmente.

El servidor Ark (ark.second.tech) no cambia — Ark es un protocolo de dos partes y el servidor es inherente a él.`,
    de_DE: `Das Wallet synchronisiert jetzt mit deinem eigenen Bitcoin-Knoten statt mit einem Block-Explorer eines Drittanbieters.

• Bitcoin ist nun eine erforderliche Abhängigkeit, und Chain-Daten — Guthaben, Transaktionsstatus, Gebührenschätzungen, Broadcasts — kommen per RPC von dort. Zuvor las das Wallet die Chain von einem gehosteten Explorer (mempool.second.tech), was bedeutete, der Bitcoin-Sicht eines anderen zu vertrauen und bei einer Chain-Spaltung dessen Konsensregeln zu folgen statt denen, die du selbst betreibst.
• Bestehende Wallets werden beim ersten Start automatisch umgestellt; Guthaben, VTXOs und Verlauf bleiben unberührt.
• Dein Knoten muss archivierend sein (Pruning deaktiviert) — nur dann stellt Bitcoin RPC für andere Dienste bereit. StartOS fragt nach, wenn Pruning aktiv ist.
• Bitcoin 29.0 oder neuer ist erforderlich. Darunter kann das Wallet an Ark-Runden teilnehmen, aber nicht einseitig aussteigen.

Der Ark-Server (ark.second.tech) bleibt unverändert — Ark ist ein Zwei-Parteien-Protokoll, und der Server gehört dazu.`,
    pl_PL: `Portfel synchronizuje się teraz z Twoim własnym węzłem Bitcoin, a nie z zewnętrzną przeglądarką bloków.

• Bitcoin jest teraz wymaganą zależnością, a dane łańcucha — salda, status transakcji, szacowanie opłat, rozgłaszanie — pochodzą z niego przez RPC. Wcześniej portfel czytał łańcuch z hostowanej przeglądarki (mempool.second.tech), co oznaczało zaufanie cudzemu widokowi Bitcoina i, w razie podziału łańcucha, podążanie za jego regułami konsensusu zamiast tych, które sam uruchamiasz.
• Istniejące portfele są migrowane automatycznie przy pierwszym uruchomieniu; saldo, VTXO i historia pozostają nietknięte.
• Twój węzeł musi być archiwalny (przycinanie wyłączone) — tylko wtedy Bitcoin udostępnia RPC innym usługom. StartOS poprosi Cię o zmianę, jeśli przycinanie jest włączone.
• Wymagany jest Bitcoin 29.0 lub nowszy. Poniżej tej wersji portfel może uczestniczyć w rundach Ark, ale nie może wyjść jednostronnie.

Serwer Ark (ark.second.tech) pozostaje bez zmian — Ark jest protokołem dwustronnym i serwer jest jego nieodłączną częścią.`,
    fr_FR: `Le portefeuille se synchronise désormais avec votre propre nœud Bitcoin plutôt qu'avec un explorateur de blocs tiers.

• Bitcoin est maintenant une dépendance requise, et les données de la chaîne — soldes, statut des transactions, estimations de frais, diffusions — en proviennent via RPC. Auparavant le portefeuille lisait la chaîne depuis un explorateur hébergé (mempool.second.tech), ce qui impliquait de faire confiance à la vision de Bitcoin d'un tiers et, lors d'une scission de chaîne, de suivre ses règles de consensus plutôt que celles que vous avez choisi d'exécuter.
• Les portefeuilles existants sont basculés automatiquement au premier démarrage ; votre solde, vos VTXO et votre historique restent intacts.
• Votre nœud doit être d'archive (élagage désactivé) — Bitcoin n'expose RPC aux autres services que dans ce cas. StartOS vous le signalera si l'élagage est actif.
• Bitcoin 29.0 ou ultérieur est requis. En dessous, le portefeuille peut participer aux tours Ark mais ne peut pas sortir unilatéralement.

Le serveur Ark (ark.second.tech) est inchangé — Ark est un protocole bipartite et le serveur en fait partie intégrante.`,
  },
  migrations: {},
})
