import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.7.2:1',
  releaseNotes: {
    en_US: `The wallet daemon's debug log is capped at 64 MiB and excluded from StartOS backups. An existing oversized log is reclaimed the next time the service starts.`,
    es_ES: `El registro de depuración del demonio del monedero se limita a 64 MiB y queda excluido de las copias de seguridad de StartOS. Un registro existente de mayor tamaño se libera la próxima vez que se inicia el servicio.`,
    de_DE: `Das Debug-Log des Wallet-Daemons ist auf 64 MiB begrenzt und aus StartOS-Backups ausgeschlossen. Ein vorhandenes übergroßes Log wird beim nächsten Start des Dienstes freigegeben.`,
    pl_PL: `Dziennik diagnostyczny demona portfela jest ograniczony do 64 MiB i wyłączony z kopii zapasowych StartOS. Istniejący zbyt duży dziennik zostaje zwolniony przy następnym uruchomieniu usługi.`,
    fr_FR: `Le journal de débogage du démon du portefeuille est plafonné à 64 Mio et exclu des sauvegardes StartOS. Un journal existant trop volumineux est récupéré au prochain démarrage du service.`,
  },
  migrations: {},
})
