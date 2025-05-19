import { registerGlobals } from 'react-native-webrtc'
import { AudioContext } from './AudioContext'

export const redeclareGlobals = () => {
    global.AudioContext = AudioContext

    registerGlobals()
}

export {
    ReactSipContext, ReactSipProvider, useReactSip 
} from './context'
export * from './types'

export { register } from './register'