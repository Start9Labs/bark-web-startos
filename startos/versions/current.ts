import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.5.0:0',
  releaseNotes: {
    en_US: `Updates bark-web to v0.5.0 (barkd 0.4.0).

• A failed send, offboard, or emergency exit now shows the wallet daemon's own error message instead of a generic HTTP status, so you can see what actually went wrong.
• Restoring a wallet from a seed offers an optional birthday height — the block your wallet was first used at.

Full changelog: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.5.0/CHANGELOG.md`,
    es_ES: `Actualiza bark-web a v0.5.0 (barkd 0.4.0).

• Un envío, offboard o salida de emergencia fallidos ahora muestran el mensaje de error del propio demonio del monedero en lugar de un estado HTTP genérico, para que veas qué ocurrió realmente.
• Al restaurar un monedero desde una semilla se ofrece una altura de nacimiento opcional: el bloque en el que se usó tu monedero por primera vez.

Registro de cambios completo: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.5.0/CHANGELOG.md`,
    de_DE: `Aktualisiert bark-web auf v0.5.0 (barkd 0.4.0).

• Eine fehlgeschlagene Sendung, ein Offboard oder ein Notausstieg zeigt jetzt die Fehlermeldung des Wallet-Daemons selbst statt eines allgemeinen HTTP-Status, sodass Sie sehen, was tatsächlich schiefging.
• Beim Wiederherstellen eines Wallets aus einer Seed-Phrase wird eine optionale Geburtshöhe angeboten – der Block, in dem Ihr Wallet zuerst verwendet wurde.

Vollständiges Änderungsprotokoll: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.5.0/CHANGELOG.md`,
    pl_PL: `Aktualizuje bark-web do v0.5.0 (barkd 0.4.0).

• Nieudana wysyłka, offboard lub wyjście awaryjne pokazują teraz własny komunikat błędu demona portfela zamiast ogólnego statusu HTTP, dzięki czemu widać, co naprawdę poszło nie tak.
• Przy odtwarzaniu portfela z frazy odzyskiwania dostępna jest opcjonalna wysokość urodzenia — blok, w którym portfel był użyty po raz pierwszy.

Pełny dziennik zmian: https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.5.0/CHANGELOG.md`,
    fr_FR: `Met à jour bark-web vers v0.5.0 (barkd 0.4.0).

• Un envoi, un offboard ou une sortie d'urgence en échec affiche désormais le message d'erreur du démon du portefeuille lui-même au lieu d'un statut HTTP générique, pour que vous voyiez ce qui s'est réellement passé.
• La restauration d'un portefeuille à partir d'une phrase de récupération propose une hauteur de naissance facultative — le bloc où votre portefeuille a été utilisé pour la première fois.

Journal des modifications complet : https://gitlab.com/ark-bitcoin/labs/bark-web/-/blob/v0.5.0/CHANGELOG.md`,
  },
  migrations: {},
})
