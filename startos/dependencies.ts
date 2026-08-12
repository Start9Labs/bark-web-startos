import { autoconfig } from 'bitcoin-core-startos/startos/actions/config/autoconfig'
import { i18n } from './i18n'
import { sdk } from './sdk'

export const setDependencies = sdk.setupDependencies(async ({ effects }) => {
  // A pruned node binds RPC to loopback (`rpcallowip=127.0.0.1/32`), so no other
  // service can reach it — the wallet would have no chain source at all.
  await sdk.action.createTask(effects, 'bitcoind', autoconfig, 'critical', {
    input: {
      kind: 'partial',
      accept: [{ prune: 0 }],
      set: { prune: 0 },
    },
    when: { condition: 'input-not-matches', once: false },
    reason: i18n(
      'Bark syncs from Bitcoin over RPC, which requires an archival node',
    ),
  })

  return {
    bitcoind: {
      kind: 'running',
      // Below Bitcoin 29.0 barkd can join Ark rounds but cannot unilaterally
      // exit, which would leave funds recoverable only with the Ark server's
      // cooperation — the opposite of the guarantee Ark exists to give. Every
      // line above that is floored at its own current revision: exver sorts
      // 30.x and 31.x above 29.4:4, so a bare `>=29.4:4` would also admit stale
      // builds of those — including ones predating `prune=0`, which the task
      // above cannot satisfy. Knots resolves through its `.satisfies('29.4:5')`
      // claim.
      versionRange: '(>=29.4:4 && <30) || (>=30.3:4 && <31) || >=31.1:4',
      healthChecks: ['bitcoind', 'sync-progress'],
    },
  }
})
