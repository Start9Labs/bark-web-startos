import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.3.1:0',
  releaseNotes: {
    en_US:
      'Replaces the browser login popup with a native in-app login page and updates bark-web to v0.3.1 (barkd 0.3.0). Your existing UI password still works — you now enter it on the wallet\'s own page. Set or change it under Actions → Set UI Password.',
    es_ES:
      'Reemplaza la ventana emergente de acceso del navegador por una página de inicio de sesión nativa en la app y actualiza bark-web a v0.3.1 (barkd 0.3.0). Tu contraseña de la interfaz sigue funcionando: ahora la introduces en la propia página del monedero. Configúrala o cámbiala en Acciones → Establecer contraseña de la interfaz.',
    de_DE:
      'Ersetzt das Browser-Anmelde-Popup durch eine native In-App-Anmeldeseite und aktualisiert bark-web auf v0.3.1 (barkd 0.3.0). Ihr bestehendes UI-Passwort funktioniert weiterhin – Sie geben es nun auf der eigenen Seite der Wallet ein. Festlegen oder ändern unter Aktionen → UI-Passwort festlegen.',
    pl_PL:
      'Zastępuje wyskakujące okno logowania przeglądarki natywną stroną logowania w aplikacji i aktualizuje bark-web do v0.3.1 (barkd 0.3.0). Twoje dotychczasowe hasło interfejsu nadal działa — teraz wpisujesz je na własnej stronie portfela. Ustaw je lub zmień w Akcje → Ustaw hasło interfejsu.',
    fr_FR:
      'Remplace la fenêtre de connexion du navigateur par une page de connexion native intégrée à l\'application et met à jour bark-web vers v0.3.1 (barkd 0.3.0). Votre mot de passe d\'interface existant fonctionne toujours — vous le saisissez désormais sur la page du portefeuille. Définissez-le ou modifiez-le dans Actions → Définir le mot de passe de l\'interface.',
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
