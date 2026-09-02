import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.8.0:0',
  releaseNotes: {
    en_US: `Updates Bark to bark-web 0.8.0 with the barkd 0.6.2 wallet daemon.

• A new wallet is no longer created silently. On first load the wallet asks whether to create one — showing the twelve-word recovery phrase and asking you to confirm it — or import a phrase you already hold. Existing wallets go straight to the dashboard as before, and Settings still reveals the phrase.
• Repeated payments no longer chain every payment onto the previous one's change, which used to force a disruptive whole-wallet refresh after roughly fifty payments.
• Sending validates before it submits: a destination on the wrong network is rejected instead of failing silently, and board, offboard, and emergency-exit claims wait for a current fee estimate and a valid address.
• Emergency exits can be priced before you start one, split into the broadcast fee and the later claim fee.
• Fixes a fee mismatch that made some on-chain sends from Ark fail, and adds sanity checks on round results and on incoming payments from the Ark mailbox.
• The balance chart gains a timeframe selector.

Full details: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.8.0/CHANGELOG.md and https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.6.2`,
    es_ES: `Actualiza Bark a bark-web 0.8.0 con el demonio de monedero barkd 0.6.2.

• Ya no se crea un monedero en silencio. Al abrirlo por primera vez, el monedero pregunta si quieres crear uno —mostrando la frase de recuperación de doce palabras y pidiéndote que la confirmes— o importar una frase que ya tengas. Los monederos existentes van directamente al panel, como antes, y Ajustes sigue revelando la frase.
• Los pagos sucesivos ya no encadenan cada pago con el cambio del anterior, lo que obligaba a una actualización completa del monedero tras unos cincuenta pagos.
• El envío se valida antes de confirmarse: un destino en la red equivocada se rechaza en lugar de fallar en silencio, y las operaciones de entrada, salida y reclamación de salida de emergencia esperan una estimación de comisión vigente y una dirección válida.
• Las salidas de emergencia se pueden presupuestar antes de iniciarlas, separando la comisión de difusión de la comisión de reclamación posterior.
• Corrige un desajuste de comisiones que hacía fallar algunos envíos en cadena desde Ark y añade comprobaciones de coherencia sobre los resultados de las rondas y los pagos entrantes del buzón de Ark.
• El gráfico de saldo incorpora un selector de periodo.

Detalles completos: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.8.0/CHANGELOG.md y https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.6.2`,
    de_DE: `Aktualisiert Bark auf bark-web 0.8.0 mit dem Wallet-Daemon barkd 0.6.2.

• Eine neue Wallet wird nicht mehr stillschweigend angelegt. Beim ersten Aufruf fragt die Wallet, ob eine neue erstellt werden soll — sie zeigt die zwölf Wörter der Wiederherstellungsphrase an und lässt sie bestätigen — oder ob eine vorhandene Phrase importiert wird. Bestehende Wallets gelangen wie bisher direkt zur Übersicht, und die Einstellungen zeigen die Phrase weiterhin an.
• Aufeinanderfolgende Zahlungen hängen sich nicht mehr jeweils an das Wechselgeld der vorherigen, was nach etwa fünfzig Zahlungen eine störende vollständige Wallet-Auffrischung erzwang.
• Das Senden wird vor dem Absenden geprüft: ein Ziel im falschen Netzwerk wird abgelehnt statt still zu scheitern, und Board, Offboard und die Auszahlung eines Notausstiegs warten auf eine aktuelle Gebührenschätzung und eine gültige Adresse.
• Die Kosten eines Notausstiegs lassen sich vorab schätzen, aufgeteilt in die Broadcast-Gebühr und die spätere Auszahlungsgebühr.
• Behebt eine Gebührenabweichung, an der manche On-Chain-Sendungen aus Ark scheiterten, und ergänzt Plausibilitätsprüfungen für Rundenergebnisse und eingehende Zahlungen aus dem Ark-Postfach.
• Das Guthabendiagramm erhält eine Zeitraumauswahl.

Alle Details: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.8.0/CHANGELOG.md und https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.6.2`,
    pl_PL: `Aktualizuje Bark do bark-web 0.8.0 z demonem portfela barkd 0.6.2.

• Nowy portfel nie jest już tworzony po cichu. Przy pierwszym otwarciu portfel pyta, czy utworzyć nowy — pokazując dwunastowyrazową frazę odzyskiwania i prosząc o jej potwierdzenie — czy zaimportować frazę, którą już masz. Istniejące portfele trafiają od razu do pulpitu, tak jak dotąd, a Ustawienia nadal ujawniają frazę.
• Kolejne płatności nie doczepiają się już do reszty z poprzedniej, co po około pięćdziesięciu płatnościach wymuszało uciążliwe odświeżenie całego portfela.
• Wysyłka jest sprawdzana przed zatwierdzeniem: adres z niewłaściwej sieci jest odrzucany zamiast po cichu zawodzić, a operacje wejścia, wyjścia i odbioru wyjścia awaryjnego czekają na aktualną wycenę opłaty i poprawny adres.
• Koszt wyjścia awaryjnego można oszacować przed jego rozpoczęciem, w podziale na opłatę za rozgłoszenie i późniejszą opłatę za odbiór.
• Naprawia rozbieżność opłat, przez którą część wypłat on-chain z Ark kończyła się niepowodzeniem, oraz dodaje kontrole poprawności wyników rund i przychodzących płatności ze skrzynki Ark.
• Wykres salda zyskuje wybór zakresu czasu.

Pełne szczegóły: https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.8.0/CHANGELOG.md oraz https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.6.2`,
    fr_FR: `Met à jour Bark vers bark-web 0.8.0 avec le démon de portefeuille barkd 0.6.2.

• Un nouveau portefeuille n'est plus créé silencieusement. Au premier chargement, le portefeuille demande s'il faut en créer un — en affichant la phrase de récupération de douze mots et en vous demandant de la confirmer — ou importer une phrase que vous détenez déjà. Les portefeuilles existants arrivent directement sur le tableau de bord, comme avant, et les Réglages révèlent toujours la phrase.
• Les paiements successifs ne s'enchaînent plus sur la monnaie du précédent, ce qui imposait un rafraîchissement complet du portefeuille après une cinquantaine de paiements.
• L'envoi est validé avant d'être soumis : une destination sur le mauvais réseau est refusée au lieu d'échouer silencieusement, et les opérations d'entrée, de sortie et de réclamation d'une sortie d'urgence attendent une estimation de frais à jour et une adresse valide.
• Le coût d'une sortie d'urgence peut être estimé avant de la lancer, séparé entre les frais de diffusion et les frais de réclamation ultérieurs.
• Corrige un écart de frais qui faisait échouer certains envois on-chain depuis Ark et ajoute des contrôles de cohérence sur les résultats des rondes et sur les paiements entrants de la boîte aux lettres Ark.
• Le graphique de solde gagne un sélecteur de période.

Détails complets : https://gitlab.com/ark-bitcoin/bark-web/-/blob/v0.8.0/CHANGELOG.md et https://gitlab.com/ark-bitcoin/bark/-/releases/bark-0.6.2`,
  },
  migrations: {},
})
