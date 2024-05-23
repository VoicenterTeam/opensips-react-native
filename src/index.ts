import { registerGlobals } from 'react-native-webrtc'
import { AudioContext } from './AudioContext'

export const redeclareGlobals = () => {
    global.AudioContext = AudioContext

    registerGlobals()
}

export {
    ReactSipContext, ReactSipProvider, useReactSip 
} from './context'
