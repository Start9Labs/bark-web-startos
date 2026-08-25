import { setupManifest } from '@start9labs/start-sdk'
import { bitcoindDescription, long, short } from './i18n'

export const manifest = setupManifest({
  id: 'bark-web',
  title: 'Bark Wallet',
  license: 'MIT',
  packageRepo: 'https://github.com/Start9Labs/bark-web-startos',
  upstreamRepo: 'https://gitlab.com/ark-bitcoin/labs/bark-web',
  marketingUrl: 'https://second.tech',
  donationUrl: null,
  description: { short, long },
  volumes: ['main'],
  images: {
    bark: {
      source: { dockerBuild: { dockerfile: 'bark.Dockerfile' } },
      arch: ['x86_64', 'aarch64'],
    },
  },
  dependencies: {
    bitcoind: {
      description: bitcoindDescription,
      optional: false,
      metadata: {
        title: 'Bitcoin',
        icon: 'https://raw.githubusercontent.com/Start9Labs/bitcoin-core-startos/refs/heads/30.x/dep-icon.svg',
      },
    },
  },
})
