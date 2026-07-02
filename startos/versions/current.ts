import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.3.1:0',
  releaseNotes: {
    en_US:
      'Replaces the browser login popup with a native in-app login page and updates bark-web to v0.3.1 (barkd 0.3.0). Set your login password under Actions → Set UI Password.',
    es_ES:
      'Reemplaza la ventana emergente de acceso del navegador por una página de inicio de sesión nativa en la app y actualiza bark-web a v0.3.1 (barkd 0.3.0). Configura tu contraseña de acceso en Acciones → Establecer contraseña de la interfaz.',
    de_DE:
      'Ersetzt das Browser-Anmelde-Popup durch eine native In-App-Anmeldeseite und aktualisiert bark-web auf v0.3.1 (barkd 0.3.0). Legen Sie Ihr Anmeldepasswort unter Aktionen → UI-Passwort festlegen fest.',
    pl_PL:
      'Zastępuje wyskakujące okno logowania przeglądarki natywną stroną logowania w aplikacji i aktualizuje bark-web do v0.3.1 (barkd 0.3.0). Ustaw hasło logowania w Akcje → Ustaw hasło interfejsu.',
    fr_FR:
      'Remplace la fenêtre de connexion du navigateur par une page de connexion native intégrée à l\'application et met à jour bark-web vers v0.3.1 (barkd 0.3.0). Définissez votre mot de passe de connexion dans Actions → Définir le mot de passe de l\'interface.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
