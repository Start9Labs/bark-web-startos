import { VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.9.0:5',
  releaseNotes: {
    en_US:
      'Google Drive continuous backups warn when Google will end the sign-in, explain how to sign in again when it does, and offer the sign-in link again. A new authorization code replaces the saved sign-in.',
    es_ES:
      'Las copias continuas en Google Drive avisan cuando Google vaya a poner fin al inicio de sesión, explican cómo volver a iniciar sesión cuando ocurra y vuelven a ofrecer el enlace de inicio de sesión. Un nuevo código de autorización sustituye el inicio de sesión guardado.',
    de_DE:
      'Kontinuierliche Backups auf Google Drive warnen, wenn Google die Anmeldung beenden wird, erklären dann, wie man sich erneut anmeldet, und bieten den Anmeldelink erneut an. Ein neuer Autorisierungscode ersetzt die gespeicherte Anmeldung.',
    pl_PL:
      'Kopie ciągłe na Google Drive ostrzegają, gdy Google zakończy logowanie, wyjaśniają wtedy, jak zalogować się ponownie, i ponownie podają link do logowania. Nowy kod autoryzacji zastępuje zapisane logowanie.',
    fr_FR:
      "Les sauvegardes continues sur Google Drive préviennent lorsque Google mettra fin à la connexion, expliquent alors comment se reconnecter et proposent de nouveau le lien de connexion. Un nouveau code d'autorisation remplace la connexion enregistrée.",
  },
  migrations: {},
})
