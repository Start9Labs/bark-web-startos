import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.12.0:1',
  releaseNotes: {
    en_US:
      'The session cookie is now marked Secure when you open Bark Web over HTTPS.',
    es_ES:
      'La cookie de sesión ahora se marca como Secure cuando abre Bark Web por HTTPS.',
    de_DE:
      'Das Sitzungscookie wird jetzt als Secure markiert, wenn Sie Bark Web über HTTPS öffnen.',
    pl_PL:
      'Ciasteczko sesji jest teraz oznaczane jako Secure, gdy otwierasz Bark Web przez HTTPS.',
    fr_FR:
      'Le cookie de session est désormais marqué Secure lorsque vous ouvrez Bark Web en HTTPS.',
  },
  migrations: {},
})
