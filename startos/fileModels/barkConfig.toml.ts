import { FileHelper, z } from '@start9labs/start-sdk'
import { sdk } from '../sdk'
import { configTomlSubpath } from '../utils'

// barkd's own wallet config. barkd writes it at wallet creation and re-reads it
// on every start, and there is no API to change the chain source afterwards
// (barkd 0.4.0 exposes no config route), so this file is the only way to move an
// existing wallet onto a different chain source.
//
// Only the chain-source keys are modelled; `looseObject` leaves the dozen-odd
// tuning fields barkd owns untouched through a read/write round-trip.
//
// Precedence is not additive: with both `esplora_address` and `bitcoind_address`
// present, barkd uses esplora — verified against barkd 0.4.0, which dials
// `GET /block-height/0` against the esplora URL and ignores the bitcoind keys.
// Switching a wallet to bitcoind therefore means *removing* `esplora_address`,
// not merely adding the bitcoind keys.
export const barkConfigShape = z.looseObject({
  esplora_address: z.string().optional(),
  bitcoind_address: z.string().optional(),
  bitcoind_cookiefile: z.string().optional(),
  bitcoind_user: z.string().optional(),
  bitcoind_pass: z.string().optional(),
})

export const barkConfigToml = FileHelper.toml(
  { base: sdk.volumes.main, subpath: configTomlSubpath },
  barkConfigShape,
)
