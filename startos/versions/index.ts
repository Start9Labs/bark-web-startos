import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_0_3_1_0 } from './v0.3.1_0'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_0_3_1_0],
})
