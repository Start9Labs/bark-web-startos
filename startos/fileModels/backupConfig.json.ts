import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { backupFolderDefault } from '../utils'

// User-supplied continuous-backup configuration. Small, static, and IS included
// in the native StartOS backup — it is the "pointer" (target location +
// credentials) the restore flow needs to pull the live wallet DB back from the
// external target. The heavy db.sqlite is excluded from the native backup and
// shipped continuously by backup-agent.sh instead.
//
// A local on-box backup ALWAYS runs (the agent ships to /data/local-backups
// regardless of this config) as a safety floor; this file configures the
// optional EXTERNAL targets that provide true off-box recoverability.
//
// Credentials are stored VERBATIM (plaintext), NOT rclone-obscured. The
// backup-agent obscures them with `rclone obscure` at the moment it writes
// rclone.conf, so the config never round-trips through an obscure/reveal
// heuristic on the TS side (that heuristic was fragile). This is NOT a security
// downgrade: rclone's "obscure" uses a fixed, public key, so it protects
// nothing — the real protection is (a) this file lives on the encrypted main
// volume and inside the encrypted native backup, and (b) each snapshot is
// encrypted with a key derived from the wallet mnemonic before egress, so a
// target only ever sees ciphertext.
//
// Each target carries its own `enabled` flag; the agent ships only to enabled
// targets. `path` is the folder within the target. The gdrive/dropbox `token`
// is the rclone OAuth token JSON (holds the refresh token), minted once by the
// Configure Backups action. `riskAccepted` is the user's acknowledgement that
// funds can be lost without a current external backup and a safeguarded seed.
const oauthTarget = z.object({
  enabled: z.boolean().catch(false),
  clientId: z.string().catch(''),
  clientSecret: z.string().catch(''),
  token: z.string().nullable().catch(null),
  path: z.string().catch(backupFolderDefault),
})

const nextcloudTarget = z.object({
  enabled: z.boolean().catch(false),
  url: z.string().catch(''),
  user: z.string().catch(''),
  pass: z.string().nullable().catch(null),
  insecureTls: z.boolean().catch(false),
  path: z.string().catch(backupFolderDefault),
})

const sftpTarget = z.object({
  enabled: z.boolean().catch(false),
  host: z.string().catch(''),
  user: z.string().catch(''),
  port: z.string().catch('22'),
  authType: z.enum(['password', 'key']).catch('password'),
  pass: z.string().nullable().catch(null),
  keyPem: z.string().nullable().catch(null),
  path: z.string().catch(backupFolderDefault),
})

export const backupConfigShape = z.object({
  gdrive: oauthTarget.nullable().catch(null),
  dropbox: oauthTarget.nullable().catch(null),
  nextcloud: nextcloudTarget.nullable().catch(null),
  sftp: sftpTarget.nullable().catch(null),
  riskAccepted: z.boolean().catch(false),
  // Deprecated pre-0.3.0:1 fields: the old single base64 rclone.conf blob and
  // the list of enabled `provider:path` remotes. Retained ONLY so the 0.3.0:1
  // up-migration (versions/migrateBackupV1.ts) can read and then clear them; no
  // runtime code reads these.
  rcloneConfig: z.string().nullable().catch(null),
  selectedRcloneRemotes: z.array(z.string()).nullable().catch(null),
})

export type BackupConfigJson = z.infer<typeof backupConfigShape>

export const backupConfigJson = FileHelper.json(
  { base: sdk.volumes.main, subpath: 'backup-config.json' },
  backupConfigShape,
)
