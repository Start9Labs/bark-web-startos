import { VersionGraph } from '@start9labs/start-sdk'
import { current } from './current'
import { v_0_3_1_0 } from './v0.3.1_0'
import { v_0_8_1_1 } from './v0.8.1_1'

export const versionGraph = VersionGraph.of({
  current,
  other: [v_0_3_1_0, v_0_8_1_1],
})
