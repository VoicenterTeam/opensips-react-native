import {
    ICallStatus,
    ICall as ICall2,
    IRoom,
} from '@voicenter-team/opensips-js/src/types/rtc'
import { ITimeData } from '@voicenter-team/opensips-js/src/types/timer'
import {
    MSRPMessage,
    IMessage,
} from '@voicenter-team/opensips-js/src/types/msrp'
import { WebrtcMetricsConfigType } from '@voicenter-team/opensips-js/src/types/webrtcmetrics'
import { type MediaStream } from 'react-native-webrtc'
import { MediaDeviceInfo } from './media'
import OpenSIPSJS from '@voicenter-team/opensips-js'

export { type IRoom } from '@voicenter-team/opensips-js/src/types/rtc'

export type ICall = ICall2


export type ExtraContactParams = {
  'pn-provider': string,
  'pn-param': string,
  'pn-prid': string,
}

export interface ReactSipAPI {
  state: ReactSipAPIState;
  actions: ReactSipAPIActions;
}

export interface InitConfig {
  domain: string;
  username: string;
  password: string;
}

export enum ConnectionStausEnum {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected'
}

export type MediaDeviceOption = Omit<MediaDeviceInfo, 'toJSON'>;

export interface ReactSipAPIState {
  isInitialized: boolean;
  connectionStatus: ConnectionStausEnum,
  activeCalls: { [key: string]: ICall };
  callsInActiveRoom: Array<ICall>;
  activeMessages: { [key: string]: IMessage };
  addCallToCurrentRoom: boolean;
  callAddingInProgress: string | undefined;
  activeRooms: { [key: number]: IRoom };
  msrpHistory: { [key: string]: Array<MSRPMessage> };
  availableMediaDevices: Array<MediaDeviceInfo>;
  inputMediaDeviceList: Array<MediaDeviceOption>;
  outputMediaDeviceList: Array<MediaDeviceOption>;
  selectedOutputDevice: string;
  selectedInputDevice: string;
  muteWhenJoin: boolean;
  isDND: boolean;
  isMuted: boolean;
  originalStream: MediaStream | null;
  currentActiveRoomId: number | undefined;
  autoAnswer: boolean;
  microphoneInputLevel: number;
  speakerVolume: number;
  callStatus: { [key: string]: ICallStatus };
  callTime: { [key: string]: ITimeData };
  callMetrics: { [key: string]: unknown };
  callWaiting: boolean;
}

type IceServeType = {
  urls: string;
  username?: string;
  credential?: string;
};

export interface IPCConfig {
  iceServers: IceServeType[];
}
export interface ReactSipAPIActions {
  init(
    domain: string,
    username: string,
    password: string,
    pnExtraHeaders: ExtraContactParams,
    pcConfig?: IPCConfig
  ): Promise<OpenSIPSJS | undefined>;
  register(): void
  unregister: () => void;
  muteCaller: (callId: string) => void;
  unmuteCaller: (callId: string) => void;
  mute: () => void;
  unmute: () => void;
  setMuteWhenJoin: (state: boolean) => void;
  setDND: (state: boolean) => void;
  terminateCall: (callId: string) => void;
  transferCall: (callId: string, target: string) => void;
  mergeCall: (roomId: number) => void;
  holdCall: (callId: string, automatic?: boolean) => void;
  unholdCall: (callId: string) => void;
  answerCall: (callId: string) => void;
  moveCall: (callId: string, roomId: number) => Promise<void>;
  msrpAnswer: (callId: string) => void;
  messageTerminate: (callId: string) => void;
  initCall: (target: string, addToCurrentRoom: boolean) => void;
  sendMSRP: (msrpSessionId: string, body: string) => void;
  initMSRP: (target: string, body: string, options: object) => void;
  setMicrophone: (deviceId: string) => Promise<void>;
  setSpeaker: (deviceId: string) => Promise<void>;
  sendDTMF: (callId: string, value: string) => void;
  setActiveRoom: (roomId: number | undefined) => Promise<void>;
  setMicrophoneSensitivity: (value: number) => void;
  setSpeakerVolume: (value: number) => void;
  setAutoAnswer: (value: boolean) => void;
  setCallWaiting: (value: boolean) => void;
  stop: () => void;
  disconnect: () => void;
  mergeCallByIds: (firstCallId: string, secondCallId: string) => void;
  setMetricsConfig: (config: WebrtcMetricsConfigType) => void;
}
