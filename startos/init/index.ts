import { actions } from '../actions'
import { restoreInit } from '../backups'
import { dependencies } from '../dependencies'
import { setInterfaces } from '../interfaces'
import { sdk } from '../sdk'
import { versionGraph } from '../versions'
import { taskSetPassword } from './taskSetPassword'
import { taskAcknowledgeRisk } from './taskAcknowledgeRisk'
import { taskAddBackupTarget } from './taskAddBackupTarget'

export const init = sdk.setupInit(
  restoreInit,
  versionGraph,
  setInterfaces,
  actions,
  dependencies,
  taskSetPassword,
  taskAcknowledgeRisk,
  taskAddBackupTarget,
)

export const uninit = sdk.setupUninit(versionGraph)
