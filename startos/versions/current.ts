import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.11.0:1',
  releaseNotes: {
    en_US:
      'A restore waits until every enabled backup target can be reached, and loads only an intact copy at least as recent as your StartOS backup. Backups never overwrite a newer copy on a target or replace good copies with an empty wallet. An SFTP target is held to the host key it first presented; saving one shows that key’s fingerprint.',
    es_ES:
      'La restauración espera hasta poder acceder a todos los destinos de copia activados, y solo carga una copia íntegra al menos tan reciente como tu copia de StartOS. Las copias nunca sobrescriben una copia más reciente en un destino ni reemplazan copias válidas con un monedero vacío. Un destino SFTP queda ligado a la clave de host que presentó la primera vez; al guardarlo se muestra la huella de esa clave.',
    de_DE:
      'Eine Wiederherstellung wartet, bis jedes aktivierte Sicherungsziel erreichbar ist, und lädt nur eine intakte Kopie, die mindestens so aktuell ist wie dein StartOS-Backup. Backups überschreiben nie eine neuere Kopie auf einem Ziel und ersetzen gültige Kopien nie durch eine leere Wallet. Ein SFTP-Ziel ist an den Host-Schlüssel gebunden, den es zuerst geliefert hat; beim Speichern wird dessen Fingerabdruck angezeigt.',
    pl_PL:
      'Przywracanie czeka, aż każdy włączony cel kopii będzie osiągalny, i wczytuje tylko nienaruszoną kopię co najmniej tak aktualną jak kopia StartOS. Kopie nigdy nie nadpisują nowszej kopii w celu ani nie zastępują poprawnych kopii pustym portfelem. Cel SFTP jest związany z kluczem hosta, który przedstawił za pierwszym razem; przy zapisie wyświetlany jest odcisk tego klucza.',
    fr_FR:
      "Une restauration attend que chaque cible de sauvegarde activée soit joignable, et ne charge qu'une copie intacte au moins aussi récente que votre sauvegarde StartOS. Les sauvegardes n'écrasent jamais une copie plus récente sur une cible et ne remplacent jamais des copies valides par un portefeuille vide. Une cible SFTP est liée à la clé d'hôte qu'elle a présentée la première fois ; l'enregistrer affiche l'empreinte de cette clé.",
  },
  migrations: {},
})
