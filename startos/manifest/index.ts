import { setupManifest } from '@start9labs/start-sdk'
import { long, short } from './i18n'

export const manifest = setupManifest({
  id: 'bark-web',
  title: 'Bark Wallet',
  license: 'MIT',
  packageRepo: 'https://github.com/Start9Labs/bark-startos',
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
  alerts: {
    install: null,
    update: null,
    uninstall: null,
    restore: null,
    start: null,
    stop: null,
  },
  dependencies: {},
})
