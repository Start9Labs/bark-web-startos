export const DEFAULT_LANG = 'en_US'

const dict = {
  // main.ts
  'Starting Bark Wallet!': 0,
  'Web Interface': 1,
  'The web interface is ready': 2,
  'The web interface is not ready': 3,

  // interfaces.ts
  'Web UI': 4,
  'The Bark Wallet web interface': 5,

  // actions/setUiPassword.ts, init/taskSetPassword.ts
  'Set UI Password': 6,
  'Generate a new password for logging in to the Bark Wallet web interface. Rotating it also signs out any active sessions.': 7,
  'Generate a password to log in to the Bark Wallet web interface': 8,

  // actions/acknowledgeRisk.ts
  'Backup Safety': 9,
  'How your Bark wallet is backed up, and a required acknowledgement that you can lose funds without a current external backup, your 12-word recovery phrase, and your StartOS master password.': 10,
  "<b>How your Bark wallet is backed up — please read.</b><br><br>\nEvery time your wallet changes (a payment, an Ark round, an on-chain movement), an encrypted copy is sent to your backup target — the key comes from your <b>Bark 12-word recovery phrase</b> (your wallet seed). A backup only protects you if it's <b>current</b> when you restore: an old copy <b>permanently loses any Ark or Lightning funds received or moved since</b> (on-chain funds stay recoverable from your seed).<br><br>\n<b>To stay safe, do all three:</b>\n<ul>\n<li><b>Add an external target</b> (Configure Continuous Backups). The on-box local backup alone survives only inside a manual StartOS backup, so it's usually stale when you need it.</li>\n<li><b>Take a StartOS backup afterward</b> (System → Create Backup) and keep its <b>StartOS master password</b>. That backup holds your seed and the pointer to your target; without it a restore can't find your target and comes back stale. Re-take it whenever you change targets.</li>\n<li><b>Record your Bark 12-word recovery phrase</b> when the wallet shows it as you create your wallet. If you skipped that step, imported a wallet, or your wallet was created for you by an earlier version, open the wallet, go to <b>Settings</b>, and reveal it.</li>\n</ul>\nYour web login password is separate and can be regenerated — it isn't a recovery secret. By accepting, you understand you can permanently lose funds without a current external backup, your recovery phrase, and your StartOS master password.": 11,
  'Continuous Backups': 12,
  'I understand and accept responsibility': 13,
  'I understand how my wallet is backed up, and I accept that I may permanently lose my funds if I do not keep a current external backup, my 12-word recovery phrase, and my StartOS master password.': 14,
  'You must confirm that you understand the backup situation and accept responsibility before continuing.': 15,

  // actions/backupNow.ts
  'Back Up Now': 16,
  'Immediately snapshot, encrypt, and ship the wallet database to the local backup and any configured external targets.': 17,
  'Uploads a fresh encrypted snapshot of the wallet database to the local backup and every enabled external target, replacing the copy each one holds.': 18,
  'Backup run failed (exit ${code}): ${output}': 19,
  'Backup Triggered': 20,
  'A backup run completed. Check the service logs for per-target upload results.': 21,

  // actions/configureBackup.ts
  '${label}: .onion (Tor) targets are not supported in this version. Use a clearnet address.': 22,
  "${label}: that address points at this server itself. A backup stored on this same box won't survive losing it — point at a target on a different machine.": 23,
  '${host} responded ${status}: ${body}': 24,
  'Could not parse response from ${host}: ${body}': 25,
  'Google did not return valid tokens. Re-copy the full authorization code.': 26,
  'Dropbox did not return a refresh token — the code may have expired or already been used. Approve the app in the browser and paste the fresh code it shows.': 27,
  'SFTP: invalid SSH key (missing BEGIN/END markers).': 28,
  Enabled: 29,
  'Off stops backing up to this target but keeps the settings below saved.': 30,
  'OAuth Client ID': 31,
  'From Google Cloud Console (Drive API, Desktop app).': 32,
  'OAuth Client Secret': 33,
  'From Google Cloud Console.': 34,
  'Authorization Code (if no Refresh Token)': 35,
  'From the Google OAuth redirect (the code= value or the full URL).': 36,
  'Refresh Token (optional)': 37,
  'Paste an existing token, or leave blank to generate one from the Authorization Code.': 38,
  'Folder Path': 39,
  'Folder name in your Drive root.': 40,
  'App Key': 41,
  'From the Dropbox App Console.': 42,
  'App Secret': 43,
  'The code Dropbox shows after you approve the app, not a "Generated access token".': 44,
  'Folder inside your App Folder.': 45,
  Address: 46,
  'The address you open Nextcloud at, such as https://cloud.example.com. Its WebDAV address works too.': 47,
  Username: 48,
  Password: 49,
  'An app password (Settings → Security).': 50,
  'Trust self-signed certificate': 51,
  'Skip TLS certificate verification for this server. Turn on ONLY for a Nextcloud on your own LAN using a self-signed or private-CA certificate (e.g. an IP or .local address that fails with "certificate signed by unknown authority"). Your backup is encrypted with your wallet key before upload, so the server only ever receives ciphertext either way.': 52,
  'Created if missing.': 53,
  Authentication: 54,
  '- Password: log in with the account password.\n- SSH Key: log in with an OpenSSH private key that has no passphrase.': 55,
  Host: 56,
  'Hostname or IP of the SFTP server.': 57,
  Port: 58,
  'Relative to the directory an SFTP login starts in: the home directory on most servers, elsewhere on a NAS or a chrooted account. Connect with an SFTP client and run pwd to see it. No leading slash.': 59,
  'SSH Key': 60,
  'Private Key': 61,
  'The full OpenSSH private key, including the BEGIN and END lines. A key protected by a passphrase is not supported.': 62,
  'Must be a valid OpenSSH private key': 63,
  'Configure Continuous Backups': 64,
  'Add external targets (Drive, Dropbox, Nextcloud, SFTP) for the continuous backup, which always keeps a local copy on this server too. Requires a StartOS backup to be restorable — take one after enabling a target. Toggle a target off to keep its settings. Each wallet gets its own folder inside the one you name, so several wallets can share a target.': 65,
  '<b>⚠ A StartOS backup is what makes these restorable.</b> Your wallet database isn\'t inside it, but your wallet seed and the pointer to these targets are. Set StartOS backups up, and after you enable a target below take a fresh one (System → Create Backup) — one taken earlier won\'t know about this target, so the restore comes back stale.<br><br>\n<b>Add an external, off-box target.</b> A local on-box backup always runs too, but it survives only inside a manual StartOS backup — likely stale. Use a <b>different machine</b> (a NAS, another computer, or a provider). Toggle one off to stop using it while keeping its settings. Tor .onion targets aren\'t supported yet.<br><br>\n<b>After saving:</b> run <b>Back Up Now</b> to verify, then take that StartOS backup.<br><br>\n<b>Setup:</b>\n<ul>\n<li><b>SFTP</b>: point at any always-on SSH server (NAS, Raspberry Pi, VPS). Password or SSH key auth. The folder path is relative to the directory an SFTP login starts in — the home directory on most servers, elsewhere on a NAS or a chrooted account; connect with an SFTP client and run <code>pwd</code> to see it. No leading slash.</li>\n<li><b>Nextcloud</b>: create an app password under Settings → Security; the address is the one you open Nextcloud at (its WebDAV address works too). For a LAN server with a self-signed certificate, turn on "Trust self-signed certificate".</li>\n<li><b>Dropbox</b>: create a Scoped/App-folder app, enable files.content.read+write, then supply App Key + App Secret and enable this target. Submit once — you\'ll get a Dropbox link; approve it and paste the <b>authorization code Dropbox shows you</b> (not a "Generated access token") into the Authorization Code field, then submit again.</li>\n<li><b>Google Drive</b>: create an OAuth Desktop client (Drive API enabled), then supply Client ID + Client Secret and enable this target. Submit once for a Google sign-in link; approve it, then paste the <b>code</b> from the redirected localhost URL (paste it as-is — no need to hand-edit %2F) and submit again.</li>\n<li>Prefer credentials over browser flows? Paste an existing <b>Refresh Token</b> for Google/Dropbox instead of an authorization code.</li>\n</ul>': 66,
  'Back up to Google Drive (free personal accounts work).': 67,
  'Back up to a Nextcloud instance over WebDAV.': 68,
  'Back up to any always-on SSH/SFTP server (NAS, Raspberry Pi, VPS).': 69,
  'Google Drive: Client ID and Client Secret are required.': 70,
  'Dropbox: App Key and App Secret are required.': 71,
  'Google Drive authorization required. Visit:\n${url}\nthen paste the authorization code or a refresh token and submit again.': 72,
  'Dropbox authorization required. Visit:\n${url}\napprove the app, then paste the authorization code it displays (not a "Generated access token") and submit again.': 73,
  'Nextcloud: address, username, and password are required.': 74,
  'SFTP: host and username are required.': 75,
  'SFTP: a private key is required.': 76,
  'No External Target': 77,
  'No external target is enabled. The continuous backup still keeps a local copy on this server, but that is recoverable only from a manual StartOS backup and is likely stale when you need it — add an external target, which stays current. Saved target settings were kept.': 78,
  'External Target Enabled': 79,
  'Your wallet database will be snapshotted, encrypted with your seed-derived key, and shipped to: ${targets} (plus the always-on local copy). Run "Back Up Now" to verify, and check the Continuous Backup health check for per-target results.': 80,

  // actions/setUiPassword.ts
  'The current password stops working and every active session is signed out.': 81,
  'UI Password': 82,
  'Use this password to log in to the Bark Wallet web interface in your browser.': 83,

  // init/taskAcknowledgeRisk.ts
  'Review how your wallet is backed up and acknowledge the risk: restoring a stale backup can permanently lose Ark/Lightning funds received or moved since it was taken. A current external backup and a safeguarded recovery phrase are what protect you.': 84,

  // init/taskAddBackupTarget.ts
  'Add an external target (Google Drive, Dropbox, Nextcloud, or SFTP) for the continuous backup. The local copy on this server is recoverable only from a manual StartOS backup and is likely stale — an external target stays current.': 85,

  // main.ts
  'Continuous Backup': 86,
  'No external target. The continuous backup stays on this server only, recoverable only from a StartOS backup you take manually — likely stale when you need it, risking Ark/Lightning funds received or moved since. Add an external target under Actions → Continuous Backups.': 87,
  'Backups are failing — last success ${age} ago: ${error}': 88,
  'Last backup ${age} ago': 89,
  'Backup has not succeeded yet: ${error}': 90,
  'No backup has run yet — backups happen automatically once your wallet has activity.': 91,

  // utils.ts
  'Nextcloud: that is not a valid address.': 92,
} as const

/**
 * Plumbing. DO NOT EDIT.
 */
export type I18nKey = keyof typeof dict
export type LangDict = Record<(typeof dict)[I18nKey], string>
export default dict
