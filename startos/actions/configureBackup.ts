import * as https from 'https'
import { URLSearchParams } from 'url'
import { backupConfigJson } from '../fileModels/backupConfig.json'
import { sdk } from '../sdk'
import { backupFolderDefault } from '../utils'

// Unlike LND's channel.backup (which LND pre-encrypts with the seed), the Bark
// wallet DB is plaintext, so the backup-agent encrypts each snapshot with a key
// derived from the wallet mnemonic before egress — the target only ever sees
// ciphertext.
//
// This action stores each target's settings VERBATIM (plaintext) in the
// structured backup-config.json. The backup-agent obscures passwords with
// `rclone obscure` when it writes rclone.conf, so nothing here has to reproduce
// or round-trip rclone's obscure format. See fileModels/backupConfig.json.ts.

// External storage targets. The always-on local backup is handled by the agent,
// not configured here.
const VALID_PROVIDERS = ['gdrive', 'dropbox', 'nextcloud', 'sftp'] as const

function rejectOnion(addr: string, label: string): void {
  if (addr.includes('.onion'))
    throw new Error(
      `${label}: .onion (Tor) targets are not supported in this version. Use a clearnet address.`,
    )
}

// A loopback address points at this server itself — a backup that lives on this
// same box won't survive losing it (the disaster backups exist for), so reject
// the obvious cases. (We can't reliably detect a same-box service behind its own
// LAN/.local address, so the action warning covers that.)
function rejectLoopback(addr: string, label: string): void {
  const a = addr.toLowerCase()
  if (
    a.includes('localhost') ||
    a.includes('127.0.0.1') ||
    a.includes('::1') ||
    a.includes('0.0.0.0')
  )
    throw new Error(
      `${label}: that address points at this server itself. A backup stored on this same box won't survive losing it — point at a target on a different machine.`,
    )
}

function generateGoogleAuthUrl(clientId: string): string {
  return `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
    client_id: clientId,
    redirect_uri: 'http://localhost',
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive',
    access_type: 'offline',
    prompt: 'consent',
  }).toString()}`
}

// Dropbox uses the same "approve in a browser, paste the code" flow as Google.
// No redirect_uri: Dropbox then DISPLAYS the code on-screen (so nothing has to
// be whitelisted), and the token exchange below likewise omits redirect_uri to
// match. token_access_type=offline is what makes Dropbox return a refresh token.
function generateDropboxAuthUrl(clientId: string): string {
  return `https://www.dropbox.com/oauth2/authorize?${new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    token_access_type: 'offline',
  }).toString()}`
}

// Normalize a pasted OAuth authorization code. When copied out of a redirect
// URL the code is URL-encoded (Google's look like `4%2F0Ad…`), and pasting that
// verbatim used to require hand-editing `%2F`→`/`. Accept a full redirect URL,
// a bare `code=…` fragment, or the raw code, and decode it once.
function extractAuthCode(raw: string): string {
  let code = (raw || '').trim()
  const m = code.match(/[?&]code=([^&\s]+)/) || code.match(/^code=([^&\s]+)/)
  if (m) code = m[1]
  try {
    code = decodeURIComponent(code)
  } catch {
    // not valid percent-encoding — keep the raw value
  }
  return code
}

function httpsPostJson(
  hostname: string,
  path: string,
  body: string,
  headers: Record<string, string>,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname,
        path,
        method: 'POST',
        headers: { 'Content-Length': Buffer.byteLength(body), ...headers },
      },
      (res) => {
        let data = ''
        res.on('data', (c) => (data += c))
        res.on('end', () => {
          if (res.statusCode !== 200)
            reject(
              new Error(`${hostname} responded ${res.statusCode}: ${data}`),
            )
          else
            try {
              resolve(JSON.parse(data))
            } catch {
              reject(
                new Error(`Could not parse response from ${hostname}: ${data}`),
              )
            }
        })
      },
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// Exchange a fresh authorization code for an rclone token JSON (holds the
// refresh token rclone uses to mint access tokens). Runs only when a target is
// being enabled with a new code.
async function exchangeGoogleCode(
  clientId: string,
  clientSecret: string,
  authCodeRaw: string,
): Promise<string> {
  const r = await httpsPostJson(
    'oauth2.googleapis.com',
    '/token',
    new URLSearchParams({
      code: extractAuthCode(authCodeRaw),
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: 'http://localhost',
      grant_type: 'authorization_code',
    }).toString(),
    { 'Content-Type': 'application/x-www-form-urlencoded' },
  )
  if (!r.access_token || !r.refresh_token)
    throw new Error(
      'Google did not return valid tokens. Re-copy the full authorization code.',
    )
  return JSON.stringify({
    access_token: r.access_token,
    token_type: r.token_type || 'Bearer',
    refresh_token: r.refresh_token,
    expiry: new Date(Date.now() + r.expires_in * 1000).toISOString(),
  })
}

async function exchangeDropboxCode(
  clientId: string,
  clientSecret: string,
  authCodeRaw: string,
): Promise<string> {
  const r = await httpsPostJson(
    'api.dropboxapi.com',
    '/oauth2/token',
    new URLSearchParams({
      code: extractAuthCode(authCodeRaw),
      grant_type: 'authorization_code',
    }).toString(),
    {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  )
  if (!r.refresh_token)
    throw new Error(
      'Dropbox did not return a refresh token — the code may have expired or already been used. Approve the app in the browser and paste the fresh code it shows.',
    )
  return `{"access_token":"${r.access_token}","token_type":"bearer","refresh_token":"${r.refresh_token}","expiry":"${new Date(Date.now() + r.expires_in * 1000).toISOString()}"}`
}

// Build a DUMMY-access-token rclone token JSON from a bare refresh token. rclone
// refreshes the (expired) access token on first use, so only the refresh token
// needs to be real.
function tokenFromRefresh(refreshToken: string, google: boolean): string {
  return google
    ? JSON.stringify({
        access_token: 'DUMMY',
        token_type: 'Bearer',
        refresh_token: refreshToken,
        expiry: '2020-01-01T00:00:00Z',
      })
    : `{"access_token":"DUMMY","token_type":"bearer","refresh_token":"${refreshToken}","expiry":"2020-01-01T00:00:00Z"}`
}

// Normalize a pasted OpenSSH private key into the single-line, `\n`-escaped form
// rclone.conf's key_pem wants (the agent writes it verbatim).
function normalizeKeyPem(keyInput: string): string {
  const begin = '-----BEGIN OPENSSH PRIVATE KEY-----'
  const end = '-----END OPENSSH PRIVATE KEY-----'
  const norm = keyInput.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (!norm.includes(begin) || !norm.includes(end))
    throw new Error('SFTP: invalid SSH key (missing BEGIN/END markers).')
  const body = norm
    .substring(norm.indexOf(begin) + begin.length, norm.indexOf(end))
    .replace(/\s+/g, '')
  const out = [begin]
  for (let i = 0; i < body.length; i += 70) out.push(body.substring(i, i + 70))
  out.push(end)
  return out.join('\n').replace(/\n/g, '\\n')
}

function refreshOf(tok?: string | null): string {
  try {
    return JSON.parse(tok || '{}').refresh_token || ''
  } catch {
    return ''
  }
}

const WARNING = `<b>⚠ A StartOS backup is what makes these restorable.</b> Your wallet database isn't inside it, but your wallet seed and the pointer to these targets are. Set StartOS backups up, and after you enable a target below take a fresh one (System → Create Backup) — one taken earlier won't know about this target, so the restore comes back stale.<br><br>
<b>Add an external, off-box target.</b> A local on-box backup always runs too, but it survives only inside a manual StartOS backup — likely stale. Use a <b>different machine</b> (a NAS, another computer, or a provider). Toggle one off to stop using it while keeping its settings. Tor .onion targets aren't supported yet.<br><br>
<b>After saving:</b> run <b>Back Up Now</b> to verify, then take that StartOS backup.<br><br>
<b>Setup:</b>
<ul>
<li><b>SFTP</b>: point at any always-on SSH server (NAS, Raspberry Pi, VPS). Password or SSH key auth. Use a relative folder path (no leading /) to land in the home directory.</li>
<li><b>Nextcloud</b>: create an app password under Settings → Security; use the WebDAV URL https://your.host/remote.php/dav/files/USERNAME/. For a LAN server with a self-signed certificate, turn on "Trust self-signed certificate".</li>
<li><b>Dropbox</b>: create a Scoped/App-folder app, enable files.content.read+write, then supply App Key + App Secret and enable this target. Submit once — you'll get a Dropbox link; approve it and paste the <b>authorization code Dropbox shows you</b> (not a "Generated access token") into the Authorization Code field, then submit again.</li>
<li><b>Google Drive</b>: create an OAuth Desktop client (Drive API enabled), then supply Client ID + Client Secret and enable this target. Submit once for a Google sign-in link; approve it, then paste the <b>code</b> from the redirected localhost URL (paste it as-is — no need to hand-edit %2F) and submit again.</li>
<li>Prefer credentials over browser flows? Paste an existing <b>Refresh Token</b> for Google/Dropbox instead of an authorization code.</li>
</ul>`

const enabledToggle = () =>
  sdk.Value.toggle({
    name: 'Enabled',
    description: 'Send wallet backups to this target.',
    default: false,
  })

// Storage-target field sets (plain records so we can prepend the toggle).
const gdriveFields = {
  'gdrive-client-id': sdk.Value.text({
    name: 'OAuth Client ID',
    description: 'From Google Cloud Console (Drive API, Desktop app).',
    default: '',
    required: false,
  }),
  'gdrive-client-secret': sdk.Value.text({
    name: 'OAuth Client Secret',
    description: 'From Google Cloud Console.',
    default: '',
    masked: true,
    required: false,
  }),
  'gdrive-auth-code': sdk.Value.text({
    name: 'Authorization Code (if no Refresh Token)',
    description:
      'From the Google OAuth redirect (the code= value or the full URL).',
    default: '',
    masked: true,
    required: false,
  }),
  'gdrive-refresh-token': sdk.Value.text({
    name: 'Refresh Token (optional)',
    description:
      'Paste an existing token, or leave blank to generate one from the Authorization Code.',
    default: '',
    masked: true,
    required: false,
  }),
  'gdrive-path': sdk.Value.text({
    name: 'Folder Path',
    description: 'Folder name in your Drive root.',
    default: backupFolderDefault,
    required: false,
  }),
}

const dropboxFields = {
  'dropbox-client-id': sdk.Value.text({
    name: 'App Key',
    description: 'From the Dropbox App Console.',
    default: '',
    required: false,
  }),
  'dropbox-client-secret': sdk.Value.text({
    name: 'App Secret',
    description: 'From the Dropbox App Console.',
    default: '',
    masked: true,
    required: false,
  }),
  'dropbox-auth-code': sdk.Value.text({
    name: 'Authorization Code (if no Refresh Token)',
    description: 'From the Dropbox OAuth redirect.',
    default: '',
    masked: true,
    required: false,
  }),
  'dropbox-refresh-token': sdk.Value.text({
    name: 'Refresh Token (optional)',
    description:
      'Paste an existing token, or leave blank to generate one from the Authorization Code.',
    default: '',
    masked: true,
    required: false,
  }),
  'dropbox-path': sdk.Value.text({
    name: 'Folder Path',
    description: 'Folder inside your App Folder.',
    default: backupFolderDefault,
    required: false,
  }),
}

const nextcloudFields = {
  'nextcloud-url': sdk.Value.text({
    name: 'WebDAV URL',
    description: 'e.g. https://your.host/remote.php/dav/files/USERNAME/',
    default: '',
    required: false,
  }),
  'nextcloud-user': sdk.Value.text({
    name: 'Username',
    description: 'Your Nextcloud login.',
    default: '',
    required: false,
  }),
  'nextcloud-pass': sdk.Value.text({
    name: 'Password',
    description: 'An app password (Settings → Security).',
    default: '',
    masked: true,
    required: false,
  }),
  'nextcloud-insecure-tls': sdk.Value.toggle({
    name: 'Trust self-signed certificate',
    description:
      'Skip TLS certificate verification for this server. Turn on ONLY for a Nextcloud on your own LAN using a self-signed or private-CA certificate (e.g. an IP or .local address that fails with "certificate signed by unknown authority"). Your backup is encrypted with your wallet key before upload, so the server only ever receives ciphertext either way.',
    default: false,
  }),
  'nextcloud-path': sdk.Value.text({
    name: 'Folder Path',
    description: 'Created if missing.',
    default: backupFolderDefault,
    required: false,
  }),
}

const sftpFields = {
  auth: sdk.Value.union({
    name: 'Authentication',
    description: 'Password or SSH key.',
    default: 'password',
    variants: sdk.Variants.of({
      password: {
        name: 'Password',
        spec: sdk.InputSpec.of({
          'sftp-host': sdk.Value.text({
            name: 'Host',
            description: 'Hostname or IP of the SFTP server.',
            default: '',
            required: false,
          }),
          'sftp-user': sdk.Value.text({
            name: 'Username',
            description: 'Login username.',
            default: '',
            required: false,
          }),
          'sftp-pass': sdk.Value.text({
            name: 'Password',
            description: 'Login password.',
            default: '',
            masked: true,
            required: false,
          }),
          'sftp-port': sdk.Value.text({
            name: 'Port',
            description: 'Default 22.',
            default: '22',
            required: false,
          }),
          'sftp-path': sdk.Value.text({
            name: 'Folder Path',
            description: 'Relative path (no leading /) for the home dir.',
            default: backupFolderDefault,
            required: false,
          }),
        }),
      },
      key: {
        name: 'SSH Key',
        spec: sdk.InputSpec.of({
          'sftp-host': sdk.Value.text({
            name: 'Host',
            description: 'Hostname or IP of the SFTP server.',
            default: '',
            required: false,
          }),
          'sftp-user': sdk.Value.text({
            name: 'Username',
            description: 'Login username.',
            default: '',
            required: false,
          }),
          'sftp-key': sdk.Value.text({
            name: 'Private Key',
            description:
              'Full OpenSSH private key, including the BEGIN/END lines.',
            default: '',
            required: false,
            masked: false,
            patterns: [
              {
                regex:
                  '^-----BEGIN OPENSSH PRIVATE KEY-----[\\s\\S]*-----END OPENSSH PRIVATE KEY-----\\s*$',
                description: 'Must be a valid OpenSSH private key',
              },
            ],
          }),
          'sftp-port': sdk.Value.text({
            name: 'Port',
            description: 'Default 22.',
            default: '22',
            required: false,
          }),
          'sftp-path': sdk.Value.text({
            name: 'Folder Path',
            description: 'Relative path (no leading /) for the home dir.',
            default: backupFolderDefault,
            required: false,
          }),
        }),
      },
    }),
  }),
}

// A storage target = an object with an enable toggle + its settings, so
// toggling it off preserves the saved credentials.
function storageTarget(
  name: string,
  description: string,
  fields: Record<string, any>,
) {
  return sdk.Value.object(
    { name, description },
    sdk.InputSpec.of({ enabled: enabledToggle(), ...fields }),
  )
}

export const configureBackup = sdk.Action.withInput(
  'configure-backup',

  async ({ effects }) => ({
    name: 'Configure Backups',
    description:
      'Add encrypted, off-box backup targets (Drive, Dropbox, Nextcloud, SFTP). A local on-box backup always runs too. Requires a StartOS backup to be restorable — take one after enabling a target. Toggle a target off to keep its settings.',
    warning: WARNING,
    allowedStatuses: 'any',
    group: 'Backups',
    visibility: 'enabled',
  }),

  sdk.InputSpec.of({
    gdrive: storageTarget(
      'Google Drive',
      'Back up to Google Drive (free personal accounts work).',
      gdriveFields,
    ),
    dropbox: storageTarget('Dropbox', 'Back up to Dropbox.', dropboxFields),
    nextcloud: storageTarget(
      'Nextcloud',
      'Back up to a Nextcloud instance over WebDAV.',
      nextcloudFields,
    ),
    sftp: storageTarget(
      'SFTP',
      'Back up to any always-on SSH/SFTP server (NAS, Raspberry Pi, VPS).',
      sftpFields,
    ),
  }),

  // Prefill the form from the structured config. Passwords / auth codes are left
  // blank (they round-trip as "unchanged" and the handler keeps the stored
  // value); everything else shows its saved value.
  async ({ effects }) => {
    const cfg = (await backupConfigJson
      .read()
      .once()
      .catch(() => null)) as any
    const g = cfg?.gdrive || {}
    const d = cfg?.dropbox || {}
    const n = cfg?.nextcloud || {}
    const s = cfg?.sftp || {}
    return {
      gdrive: {
        enabled: !!g.enabled,
        'gdrive-client-id': g.clientId || '',
        'gdrive-client-secret': g.clientSecret || '',
        'gdrive-auth-code': '',
        'gdrive-refresh-token': refreshOf(g.token),
        'gdrive-path': g.path || backupFolderDefault,
      },
      dropbox: {
        enabled: !!d.enabled,
        'dropbox-client-id': d.clientId || '',
        'dropbox-client-secret': d.clientSecret || '',
        'dropbox-auth-code': '',
        'dropbox-refresh-token': refreshOf(d.token),
        'dropbox-path': d.path || backupFolderDefault,
      },
      nextcloud: {
        enabled: !!n.enabled,
        'nextcloud-url': n.url || '',
        'nextcloud-user': n.user || '',
        'nextcloud-pass': '',
        'nextcloud-insecure-tls': !!n.insecureTls,
        'nextcloud-path': n.path || backupFolderDefault,
      },
      sftp: {
        enabled: !!s.enabled,
        auth: {
          selection: s.authType === 'key' ? 'key' : 'password',
          value: {
            'sftp-host': s.host || '',
            'sftp-user': s.user || '',
            'sftp-port': s.port || '22',
            'sftp-path': s.path || backupFolderDefault,
            ...(s.authType === 'key'
              ? { 'sftp-key': '' }
              : { 'sftp-pass': '' }),
          },
        },
      },
    } as any
  },

  async ({ effects, input }) => {
    const cfg = (await backupConfigJson
      .read()
      .once()
      .catch(() => null)) as any
    const patch: any = {}

    for (const provider of VALID_PROVIDERS) {
      const o = (input as any)[provider] || {}
      const enabled = !!o.enabled
      const prev = cfg?.[provider] || {}

      if (provider === 'gdrive' || provider === 'dropbox') {
        const google = provider === 'gdrive'
        const clientId =
          o[`${provider}-client-id`]?.trim() || prev.clientId || ''
        const clientSecret =
          o[`${provider}-client-secret`]?.trim() || prev.clientSecret || ''
        const authCodeRaw = o[`${provider}-auth-code`]?.trim()
        const refreshToken = o[`${provider}-refresh-token`]?.trim()
        const path =
          o[`${provider}-path`]?.trim() || prev.path || backupFolderDefault
        if (enabled && (!clientId || !clientSecret))
          throw new Error(
            google
              ? 'Google Drive: Client ID and Client Secret are required.'
              : 'Dropbox: App Key and App Secret are required.',
          )
        // Keep the stored token unless the user supplied a new refresh token or
        // a fresh authorization code (exchanged here, only when enabling).
        let token: string | null = prev.token || null
        if (refreshToken) token = tokenFromRefresh(refreshToken, google)
        else if (enabled && authCodeRaw)
          token = google
            ? await exchangeGoogleCode(clientId, clientSecret, authCodeRaw)
            : await exchangeDropboxCode(clientId, clientSecret, authCodeRaw)
        if (enabled && !token)
          throw new Error(
            google
              ? `Google Drive authorization required. Visit:\n${generateGoogleAuthUrl(clientId)}\nthen paste the authorization code or a refresh token and submit again.`
              : `Dropbox authorization required. Visit:\n${generateDropboxAuthUrl(clientId)}\napprove the app, then paste the authorization code it displays (not a "Generated access token") and submit again.`,
          )
        patch[provider] = { enabled, clientId, clientSecret, token, path }
      } else if (provider === 'nextcloud') {
        const url = o['nextcloud-url']?.trim() || prev.url || ''
        const user = o['nextcloud-user']?.trim() || prev.user || ''
        const pass = o['nextcloud-pass']?.trim() || prev.pass || null
        const insecureTls = !!o['nextcloud-insecure-tls']
        const path =
          o['nextcloud-path']?.trim() || prev.path || backupFolderDefault
        if (enabled) {
          rejectOnion(url, 'Nextcloud')
          rejectLoopback(url, 'Nextcloud')
          if (!url || !user || !pass)
            throw new Error(
              'Nextcloud: URL, username, and password are required.',
            )
        }
        patch.nextcloud = { enabled, url, user, pass, insecureTls, path }
      } else {
        // sftp
        const auth = o.auth || { selection: 'password', value: {} }
        const v = auth.value || {}
        const host = v['sftp-host']?.trim() || prev.host || ''
        const user = v['sftp-user']?.trim() || prev.user || ''
        const port = v['sftp-port']?.trim() || prev.port || '22'
        const path = v['sftp-path']?.trim() || prev.path || backupFolderDefault
        const authType = auth.selection === 'key' ? 'key' : 'password'
        if (enabled) {
          rejectOnion(host, 'SFTP')
          rejectLoopback(host, 'SFTP')
          if (!host || !user)
            throw new Error('SFTP: host and username are required.')
        }
        let pass: string | null = null
        let keyPem: string | null = null
        if (authType === 'password') {
          pass = v['sftp-pass']?.trim() || prev.pass || null
        } else {
          const keyInput = v['sftp-key']
          keyPem =
            keyInput && keyInput.trim()
              ? normalizeKeyPem(keyInput)
              : prev.keyPem || null
          if (enabled && !keyPem)
            throw new Error('SFTP: a private key is required.')
        }
        patch.sftp = { enabled, host, user, port, authType, pass, keyPem, path }
      }
    }

    await backupConfigJson.merge(effects, patch)

    const enabledList = VALID_PROVIDERS.filter((p) => patch[p]?.enabled)
    if (enabledList.length === 0) {
      return {
        version: '1',
        title: 'No External Target',
        message:
          'No external backup target is enabled. A local backup still runs on this server, but it is recoverable only from a manual StartOS backup and is likely stale when you need it — add an off-box target, which stays current. Saved target settings were kept.',
        result: null,
      }
    }
    return {
      version: '1',
      title: 'External Backup Enabled',
      message: `Your wallet database will be snapshotted, encrypted with your seed-derived key, and shipped to: ${enabledList.join(
        ', ',
      )} (plus the always-on local copy). Run "Back Up Now" to verify, and check the Wallet Backup health status for per-target results.`,
      result: null,
    }
  },
)
