import * as crypto from 'crypto'
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
// Each target is a top-level object with an `enabled` toggle alongside its
// settings, so toggling a target off keeps its saved credentials.

// External storage targets (rclone remotes). The always-on local backup is
// handled by the agent, not configured here.
const VALID_PROVIDERS = ['gdrive', 'dropbox', 'nextcloud', 'sftp'] as const

function parseRcloneConf(conf: string): Record<string, Record<string, string>> {
  const sections: Record<string, Record<string, string>> = {}
  let current = ''
  conf.split('\n').forEach((line) => {
    line = line.trim()
    if (line.startsWith('[') && line.endsWith(']')) {
      current = line.slice(1, -1)
      sections[current] = {}
    } else if (line.includes('=') && current) {
      const i = line.indexOf('=')
      sections[current][line.substring(0, i).trim()] = line
        .substring(i + 1)
        .trim()
    }
  })
  return sections
}

function removeSection(conf: string, name: string): string {
  const lines = conf.split('\n')
  let inSection = false
  return lines
    .filter((line) => {
      const t = line.trim()
      if (t === `[${name}]`) {
        inSection = true
        return false
      }
      if (inSection && t.startsWith('[') && t.endsWith(']')) {
        inSection = false
        return true
      }
      return !inSection
    })
    .join('\n')
    .trim()
}

// rclone's standard credential obscuring (fixed public key) — required so
// rclone can read the user's target passwords from the config. NOT secrecy;
// the real protection is the seed-derived encryption applied to the snapshot.
function obscure(plain: string): string {
  const key = Buffer.from(
    '9c935b48730a554d6bfd7c63c886a92bd390198eb8128afbf4de162b8b95f638',
    'hex',
  )
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  return Buffer.concat([iv, enc])
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function isObscured(value: string): boolean {
  if (!value) return false
  try {
    const padded = value + '==='.slice(value.length % 4)
    return Buffer.from(padded, 'base64').length >= 16
  } catch {
    return false
  }
}

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

const WARNING = `<b>⚠ A StartOS backup is what makes these restorable.</b> Your wallet database isn't inside it, but your wallet seed and the pointer to these targets are. Set StartOS backups up, and after you enable a target below take a fresh one (System → Create Backup) — one taken earlier won't know about this target, so the restore comes back stale.<br><br>
<b>Add an external, off-box target.</b> A local on-box backup always runs too, but it survives only inside a manual StartOS backup — likely stale. Use a <b>different machine</b> (a NAS, another computer, or a provider). Toggle one off to stop using it while keeping its settings. Tor .onion targets aren't supported yet.<br><br>
<b>After saving:</b> run <b>Back Up Now</b> to verify, then take that StartOS backup.<br><br>
<b>Setup:</b>
<ul>
<li><b>SFTP</b>: point at any always-on SSH server (NAS, Raspberry Pi, VPS). Password or SSH key auth. Use a relative folder path (no leading /) to land in the home directory.</li>
<li><b>Nextcloud</b>: create an app password under Settings → Security; use the WebDAV URL https://your.host/remote.php/dav/files/USERNAME/.</li>
<li><b>Dropbox</b>: create a Scoped/App-folder app, enable files.content.read+write, then supply App Key + App Secret + (Authorization Code or Refresh Token).</li>
<li><b>Google Drive</b>: create an OAuth Desktop client (Drive API enabled), then supply Client ID + Client Secret + (Authorization Code or Refresh Token).</li>
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

  async ({ effects }) => {
    const config = (await backupConfigJson
      .read()
      .once()
      .catch(() => ({}))) as any
    const existingConf = config?.rcloneConfig
      ? Buffer.from(config.rcloneConfig, 'base64').toString('utf8')
      : ''
    const sections = parseRcloneConf(existingConf)
    const getPath = (p: string) =>
      config?.selectedRcloneRemotes
        ?.find((r: string) => r.startsWith(p + ':'))
        ?.split(':')[1] || backupFolderDefault
    const isOn = (p: string) =>
      !!config?.selectedRcloneRemotes?.some((r: string) =>
        r.startsWith(p + ':'),
      )
    const refreshOf = (tok?: string) => {
      try {
        return JSON.parse(tok || '{}').refresh_token || ''
      } catch {
        return ''
      }
    }
    const gdrive = sections['gdrive'] || {}
    const dropbox = sections['dropbox'] || {}
    const sftp = sections['sftp'] || {}

    return {
      gdrive: {
        enabled: isOn('gdrive'),
        'gdrive-client-id': gdrive.client_id || '',
        'gdrive-client-secret': gdrive.client_secret || '',
        'gdrive-auth-code': '',
        'gdrive-refresh-token': refreshOf(gdrive.token),
        'gdrive-path': getPath('gdrive'),
      },
      dropbox: {
        enabled: isOn('dropbox'),
        'dropbox-client-id': dropbox.client_id || '',
        'dropbox-client-secret': dropbox.client_secret || '',
        'dropbox-auth-code': '',
        'dropbox-refresh-token': refreshOf(dropbox.token),
        'dropbox-path': getPath('dropbox'),
      },
      nextcloud: {
        enabled: isOn('nextcloud'),
        'nextcloud-url': sections['nextcloud']?.url || '',
        'nextcloud-user': sections['nextcloud']?.user || '',
        'nextcloud-pass': '',
        'nextcloud-path': getPath('nextcloud'),
      },
      sftp: {
        enabled: isOn('sftp'),
        auth: {
          selection: sftp.key_pem ? 'key' : 'password',
          value: {
            'sftp-host': sftp.host || '',
            'sftp-user': sftp.user || '',
            'sftp-port': sftp.port || '22',
            'sftp-path': getPath('sftp'),
            ...(sftp.key_pem ? { 'sftp-key': '' } : { 'sftp-pass': '' }),
          },
        },
      },
    } as any
  },

  async ({ effects, input }) => {
    const config = (await backupConfigJson
      .read()
      .once()
      .catch(() => ({}))) as any
    // Start from the existing config so toggled-off targets keep their saved
    // sections (only enabled targets land in selectedRcloneRemotes).
    let conf = config?.rcloneConfig
      ? Buffer.from(config.rcloneConfig, 'base64').toString('utf8')
      : ''
    const sections = parseRcloneConf(conf)
    const enabledRemotes: string[] = []

    for (const provider of VALID_PROVIDERS) {
      const o = (input as any)[provider] || {}
      if (!o.enabled) continue // keep its section (metadata preserved), inactive

      const existing = sections[provider] || {}
      let path = backupFolderDefault
      const lines = [`[${provider}]`]

      if (provider === 'gdrive') {
        path = o['gdrive-path']?.trim() || getExistingPath(config, 'gdrive')
        const clientId =
          o['gdrive-client-id']?.trim() || existing.client_id || ''
        const clientSecret =
          o['gdrive-client-secret']?.trim() || existing.client_secret || ''
        const authCodeRaw = o['gdrive-auth-code']?.trim()
        const refreshToken = o['gdrive-refresh-token']?.trim()
        if (!clientId || !clientSecret)
          throw new Error(
            'Google Drive: Client ID and Client Secret are required.',
          )
        let token = existing.token || ''
        if (refreshToken) {
          token = JSON.stringify({
            access_token: 'DUMMY',
            token_type: 'Bearer',
            refresh_token: refreshToken,
            expiry: '2020-01-01T00:00:00Z',
          })
        } else if (authCodeRaw) {
          const code = authCodeRaw.includes('code=')
            ? (authCodeRaw.match(/code=([^&]+)/)?.[1] ?? authCodeRaw)
            : authCodeRaw
          const r = await httpsPostJson(
            'oauth2.googleapis.com',
            '/token',
            new URLSearchParams({
              code,
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
          token = JSON.stringify({
            access_token: r.access_token,
            token_type: r.token_type || 'Bearer',
            refresh_token: r.refresh_token,
            expiry: new Date(Date.now() + r.expires_in * 1000).toISOString(),
          })
        }
        if (!token)
          throw new Error(
            `Google Drive authorization required. Visit:\n${generateGoogleAuthUrl(clientId)}\nthen paste the authorization code or a refresh token and submit again.`,
          )
        lines.push(
          'type = drive',
          'scope = drive',
          `client_id = ${clientId}`,
          `client_secret = ${clientSecret}`,
          `token = ${token}`,
        )
      } else if (provider === 'dropbox') {
        path = o['dropbox-path']?.trim() || getExistingPath(config, 'dropbox')
        const clientId =
          o['dropbox-client-id']?.trim() || existing.client_id || ''
        const clientSecret =
          o['dropbox-client-secret']?.trim() || existing.client_secret || ''
        const authCode = o['dropbox-auth-code']?.trim()
        const refreshToken = o['dropbox-refresh-token']?.trim()
        if (!clientId || !clientSecret)
          throw new Error('Dropbox: App Key and App Secret are required.')
        let token = existing.token || ''
        if (authCode) {
          const r = await httpsPostJson(
            'api.dropboxapi.com',
            '/oauth2/token',
            new URLSearchParams({
              code: authCode,
              grant_type: 'authorization_code',
            }).toString(),
            {
              Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          )
          if (!r.refresh_token)
            throw new Error(
              'Dropbox did not return a refresh token. Re-copy the authorization code.',
            )
          token = `{"access_token":"${r.access_token}","token_type":"bearer","refresh_token":"${r.refresh_token}","expiry":"${new Date(Date.now() + r.expires_in * 1000).toISOString()}"}`
        } else if (refreshToken) {
          token = `{"access_token":"DUMMY","token_type":"bearer","refresh_token":"${refreshToken}","expiry":"2020-01-01T00:00:00Z"}`
        }
        if (!token)
          throw new Error(
            'Dropbox: provide an Authorization Code or an existing Refresh Token.',
          )
        lines.push(
          'type = dropbox',
          `client_id = ${clientId}`,
          `client_secret = ${clientSecret}`,
          `token = ${token}`,
        )
      } else if (provider === 'nextcloud') {
        path =
          o['nextcloud-path']?.trim() || getExistingPath(config, 'nextcloud')
        const url = (o['nextcloud-url']?.trim() || existing.url || '') as string
        const user = o['nextcloud-user']?.trim() || existing.user || ''
        rejectOnion(url, 'Nextcloud')
        rejectLoopback(url, 'Nextcloud')
        let pass = existing.pass || ''
        const passInput = o['nextcloud-pass']?.trim()
        if (passInput) pass = obscure(passInput)
        else if (pass && !isObscured(pass)) pass = obscure(pass)
        if (!url || !user || !pass)
          throw new Error(
            'Nextcloud: URL, username, and password are required.',
          )
        lines.push(
          'type = webdav',
          `url = ${url}`,
          'vendor = nextcloud',
          `user = ${user}`,
          `pass = ${pass}`,
        )
      } else if (provider === 'sftp') {
        const auth = o.auth
        const v = auth.value
        const host = (v['sftp-host']?.trim() || existing.host || '') as string
        const user = v['sftp-user']?.trim() || existing.user || ''
        const port = v['sftp-port']?.trim() || existing.port || '22'
        path = v['sftp-path']?.trim() || getExistingPath(config, 'sftp')
        rejectOnion(host, 'SFTP')
        rejectLoopback(host, 'SFTP')
        if (!host || !user)
          throw new Error('SFTP: host and username are required.')
        lines.push(
          'type = sftp',
          `host = ${host}`,
          `user = ${user}`,
          'key_use_agent = false',
          `port = ${port}`,
        )
        if (auth.selection === 'password') {
          let pass = existing.pass || ''
          const passInput = v['sftp-pass']?.trim()
          if (passInput) pass = obscure(passInput)
          else if (pass && !isObscured(pass)) pass = obscure(pass)
          if (pass) lines.push(`pass = ${pass}`)
        } else {
          const keyInput = v['sftp-key']
          let keyPem = existing.key_pem || ''
          if (keyInput && keyInput.trim()) {
            const begin = '-----BEGIN OPENSSH PRIVATE KEY-----'
            const end = '-----END OPENSSH PRIVATE KEY-----'
            const norm = keyInput
              .replace(/\r\n/g, '\n')
              .replace(/\r/g, '\n')
              .trim()
            if (!norm.includes(begin) || !norm.includes(end))
              throw new Error(
                'SFTP: invalid SSH key (missing BEGIN/END markers).',
              )
            const body = norm
              .substring(norm.indexOf(begin) + begin.length, norm.indexOf(end))
              .replace(/\s+/g, '')
            const out = [begin]
            for (let i = 0; i < body.length; i += 70)
              out.push(body.substring(i, i + 70))
            out.push(end)
            keyPem = out.join('\n').replace(/\n/g, '\\n')
          }
          if (!keyPem) throw new Error('SFTP: a private key is required.')
          lines.push(`key_pem = ${keyPem}`)
        }
      }

      conf = removeSection(conf, provider)
      conf = (conf.trim() + '\n' + lines.join('\n')).trim()
      enabledRemotes.push(`${provider}:${path}`)
    }

    await backupConfigJson.merge(effects, {
      selectedRcloneRemotes: enabledRemotes,
      rcloneConfig: conf.trim()
        ? Buffer.from(conf, 'utf8').toString('base64')
        : null,
    })

    if (enabledRemotes.length === 0) {
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
      message: `Your wallet database will be snapshotted, encrypted with your seed-derived key, and shipped to: ${enabledRemotes
        .map((r) => r.split(':')[0])
        .join(
          ', ',
        )} (plus the always-on local copy). Run "Back Up Now" to verify, and check the service logs for per-target results.`,
      result: null,
    }
  },
)

function getExistingPath(config: any, provider: string): string {
  return (
    config?.selectedRcloneRemotes
      ?.find((r: string) => r.startsWith(provider + ':'))
      ?.split(':')[1] || backupFolderDefault
  )
}
