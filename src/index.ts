import { registerGlobals } from 'react-native-webrtc';
import { AudioContext } from './AudioContext';
export const redeclareGlobals = () => {
  //@ts-ignore
  global.AudioContext = AudioContext;
  registerGlobals();
};
export { ReactSipContext, ReactSipProvider } from './context';
