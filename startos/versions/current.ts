import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.9.0:1',
  releaseNotes: {
    en_US:
      'The SFTP target explains which directory its folder path is relative to, and how to find it.',
    es_ES:
      'El destino SFTP explica respecto a qué directorio es relativa la ruta de su carpeta, y cómo averiguarlo.',
    de_DE:
      'Das SFTP-Ziel erklärt, auf welches Verzeichnis sich der Ordnerpfad bezieht und wie man es findet.',
    pl_PL:
      'Cel SFTP wyjaśnia, względem którego katalogu jest ścieżka folderu i jak go znaleźć.',
    fr_FR:
      'La cible SFTP explique par rapport à quel répertoire le chemin de son dossier est relatif, et comment le trouver.',
  },
  migrations: {},
})
