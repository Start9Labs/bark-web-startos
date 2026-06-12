import { sdk } from '../sdk'
import { setUiPassword } from './setUiPassword'

export const actions = sdk.Actions.of().addAction(setUiPassword)
