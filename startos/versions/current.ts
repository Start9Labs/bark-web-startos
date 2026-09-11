import { VersionInfo } from '@start9labs/start-sdk'
import { backupConfigJson } from '../fileModels/backupConfig.json'
import { backupStateJson } from '../fileModels/backupState.json'
import { nextcloudDavUrl } from '../utils'

export const current = VersionInfo.of({
  version: '0.8.1:1',
  releaseNotes: {
    en_US: `Each wallet's backups now go into a folder named for that wallet inside the target folder, so several wallets can share one account. The copies already in the folder root are no longer updated; delete them once the Continuous Backup health check reports a new backup.

A Nextcloud target accepts the address you open Nextcloud at. A saved address is completed on update.

The backup actions and health check now appear under Continuous Backups.`,
    es_ES: `Las copias de cada monedero van ahora a una carpeta con el nombre de ese monedero dentro de la carpeta de destino, así varios monederos pueden compartir una cuenta. Las copias que ya están en la raíz de la carpeta dejan de actualizarse; bórralas cuando la comprobación de estado «Copia continua» informe de una copia nueva.

Un destino Nextcloud acepta la dirección con la que abres Nextcloud. Una dirección guardada se completa al actualizar.

Las acciones de copia y la comprobación de estado aparecen ahora bajo «Copias continuas».`,
    de_DE: `Die Backups jeder Wallet landen jetzt in einem nach dieser Wallet benannten Ordner innerhalb des Zielordners, sodass mehrere Wallets ein Konto teilen können. Die bereits im Ordnerstamm liegenden Kopien werden nicht mehr aktualisiert; lösche sie, sobald die Zustandsprüfung „Kontinuierliches Backup“ ein neues Backup meldet.

Ein Nextcloud-Ziel akzeptiert die Adresse, unter der du Nextcloud öffnest. Eine gespeicherte Adresse wird beim Update vervollständigt.

Die Backup-Aktionen und die Zustandsprüfung erscheinen jetzt unter „Kontinuierliche Backups“.`,
    pl_PL: `Kopie każdego portfela trafiają teraz do folderu nazwanego od tego portfela wewnątrz folderu docelowego, więc kilka portfeli może współdzielić jedno konto. Kopie leżące już w korzeniu folderu nie są dłużej aktualizowane; usuń je, gdy kontrola stanu „Kopia ciągła” zgłosi nową kopię.

Cel Nextcloud przyjmuje adres, pod którym otwierasz Nextcloud. Zapisany adres jest uzupełniany przy aktualizacji.

Akcje kopii i kontrola stanu pojawiają się teraz w grupie „Kopie ciągłe”.`,
    fr_FR: `Les sauvegardes de chaque portefeuille vont désormais dans un dossier au nom de ce portefeuille à l'intérieur du dossier cible, si bien que plusieurs portefeuilles peuvent partager un même compte. Les copies déjà présentes à la racine du dossier ne sont plus mises à jour ; supprimez-les une fois que le contrôle « Sauvegarde continue » signale une nouvelle sauvegarde.

Une cible Nextcloud accepte l'adresse à laquelle vous ouvrez Nextcloud. Une adresse enregistrée est complétée lors de la mise à jour.

Les actions de sauvegarde et le contrôle de santé apparaissent désormais sous « Sauvegardes continues ».`,
  },
  migrations: {
    up: async ({ effects }) => {
      const nextcloud = (
        await backupConfigJson
          .read()
          .once()
          .catch(() => null)
      )?.nextcloud
      if (nextcloud?.url) {
        let url = nextcloud.url
        try {
          url = nextcloudDavUrl(nextcloud.url, nextcloud.user)
        } catch {}
        if (url !== nextcloud.url)
          await backupConfigJson.merge(effects, {
            nextcloud: { ...nextcloud, url },
          })
      }
      // The next cycle ships to the wallet's folder even if nothing changed.
      await backupStateJson.merge(effects, { lastHash: null })
    },
  },
})
