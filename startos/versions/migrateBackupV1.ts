import * as crypto from 'crypto'
import { backupConfigJson } from '../fileModels/backupConfig.json'
import { backupFolderDefault } from '../utils'

// One-time upgrade (pre-0.3.0:1 → 0.3.0:1): convert the old single base64
// rclone.conf blob (`rcloneConfig` + `selectedRcloneRemotes`) into the new
// structured, plaintext per-target config, then clear the old fields. Passwords
// in the old blob were rclone-obscured, so they are revealed here; tokens and
// SSH keys were already stored verbatim. Best-effort: if there is nothing to
// migrate (fresh install / already migrated) it no-ops, and any parse failure
// leaves the old fields untouched so the user simply reconfigures.

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

// Reverse of the old obscure(): rclone's fixed-key AES-256-CTR "reveal".
function reveal(obscured: string): string {
  if (!obscured) return ''
  try {
    const key = Buffer.from(
      '9c935b48730a554d6bfd7c63c886a92bd390198eb8128afbf4de162b8b95f638',
      'hex',
    )
    const buf = Buffer.from(
      obscured.replace(/-/g, '+').replace(/_/g, '/'),
      'base64',
    )
    const decipher = crypto.createDecipheriv(
      'aes-256-ctr',
      key,
      buf.subarray(0, 16),
    )
    return Buffer.concat([
      decipher.update(buf.subarray(16)),
      decipher.final(),
    ]).toString('utf8')
  } catch {
    return ''
  }
}

export async function migrateBackupConfigV1(effects: any): Promise<void> {
  const cfg = (await backupConfigJson
    .read()
    .once()
    .catch(() => null)) as any
  if (!cfg?.rcloneConfig) return // fresh install or already migrated
  // Never clobber an already-structured config (guards against this one-way
  // migration re-running, e.g. on a repair) — if any structured target exists,
  // the conversion already happened.
  if (cfg.gdrive || cfg.dropbox || cfg.nextcloud || cfg.sftp) return

  const s = parseRcloneConf(
    Buffer.from(cfg.rcloneConfig, 'base64').toString('utf8'),
  )
  const isOn = (p: string) =>
    !!cfg.selectedRcloneRemotes?.some((r: string) => r.startsWith(p + ':'))
  const pathOf = (p: string) =>
    cfg.selectedRcloneRemotes
      ?.find((r: string) => r.startsWith(p + ':'))
      ?.split(':')[1] || backupFolderDefault

  const patch: any = {
    rcloneConfig: undefined,
    selectedRcloneRemotes: undefined,
  }

  for (const p of ['gdrive', 'dropbox'] as const) {
    if (!s[p]) continue
    patch[p] = {
      enabled: isOn(p),
      clientId: s[p].client_id || '',
      clientSecret: s[p].client_secret || '',
      token: s[p].token || null,
      path: pathOf(p),
    }
  }
  if (s['nextcloud'])
    patch.nextcloud = {
      enabled: isOn('nextcloud'),
      url: s['nextcloud'].url || '',
      user: s['nextcloud'].user || '',
      pass: reveal(s['nextcloud'].pass || '') || null,
      insecureTls: false,
      path: pathOf('nextcloud'),
    }
  if (s['sftp'])
    patch.sftp = {
      enabled: isOn('sftp'),
      host: s['sftp'].host || '',
      user: s['sftp'].user || '',
      port: s['sftp'].port || '22',
      authType: s['sftp'].key_pem ? 'key' : 'password',
      pass: s['sftp'].pass ? reveal(s['sftp'].pass) || null : null,
      keyPem: s['sftp'].key_pem || null,
      path: pathOf('sftp'),
    }

  await backupConfigJson.merge(effects, patch)
}
