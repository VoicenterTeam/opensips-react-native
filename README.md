# Docs

## Description

This library is a wrapper over the opensips-js implementation.
It provides a React Native composable for reactive work with opensips-js functionality.
Wrap your top level component in `ReactSipProvider`, call `redeclareGlobals` to declare global variables for webrtc and then use `ReactSipContext` in the child components to use reactive opensips-js functionality.


## Andoid Configuration
Add this permissions to your AndroidManifest.xml file

_AndroidMainfest.xml_
```xml
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-feature android:name="android.hardware.camera" />
    <uses-feature android:name="android.hardware.camera.autofocus" />
    <uses-feature android:name="android.hardware.audio.output" />
    <uses-feature android:name="android.hardware.microphone" />

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```
## Basic Usage
install react-native-webrt library 
```
yarn add react-native-webrtc
```
_App.tsx_

```js
import {
  ReactSipProvider,
  redeclareGlobals,
} from "@voicenter-team/react-native-opensips";
redeclareGlobals();
export const App = (): JSX.Element => {
  return (
    <ReactSipProvider>
      <MainComponent />
    </ReactSipProvider>
  );
};
```

_MainComponent.tsx_

```js
import React, { useContext } from 'react';
import { ReactSipContext } from '@voicenter-team/react-native-opensips';
export const MainComponent = () => {
  const {actions, state} = useContext(ReactSipContext)
  const {
    selectedInputDevice,
    selectedOutputDevice,
    muteWhenJoin,
    isDND,
    addCallToCurrentRoom,
    microphoneInputLevel,
    speakerVolume,
    isMuted,
    callAddingInProgress,
    activeCalls,
    callsInActiveRoom,
    currentActiveRoomId,
    activeRooms
  } = state

  const {
    doCall,
    sendDTMF,
    muteCaller,
    callTerminate,
    callTransfer,
    callMerge,
    doCallHold,
    callAnswer,
    callMove,
    doMute
  } = actions
  //other code
  return (
    //render your coponent
  )
}
```

## Composable

### State

| Name                  | Description                                                | Type                                   | Default   |
| --------------------- | :--------------------------------------------------------- | :------------------------------------- | :-------- |
| isInitialized         | Defines if opensips-js is initialized                      | boolean                                | false     |
| activeCalls           | Active calls                                               | { [key: string]: ICall }               | {}        |
| callsInActiveRoom     | Calls in active room                                       | Array\<Call>                           | []        |
| activeMessages        | Active MSRP messages                                       | { [key: string]: IMessage }            | {}        |
| addCallToCurrentRoom  | Defines if new call should be added to current room        | boolean                                | false     |
| callAddingInProgress  | Represents call id of progressing call if such call exists | string / undefined                     | undefined |
| activeRooms           | Active rooms                                               | { [key: number]: IRoom }               | {}        |
| msrpHistory           | MSRP messages history                                      | { [key: string]: Array\<MSRPMessage> } | {}        |
| availableMediaDevices | List of available media devices                            | Array\<MediaDeviceInfo>                | []        |
| inputMediaDeviceList  | List of available input media devices                      | Array\<MediaDeviceInfo>                | []        |
| outputMediaDeviceList | List of available output media devices                     | Array\<MediaDeviceInfo>                | []        |
| selectedOutputDevice  | ID of selected output device                               | string                                 | 'default' |
| selectedInputDevice   | ID of selected input device                                | string                                 | 'default' |
| muteWhenJoin          | Defines if agent will be muted when joining call           | boolean                                | false     |
| isDND                 | Defines usage agent's 'Do Not Disturb' option              | boolean                                | false     |
| originalStream        | Agent's Audio Stream object                                | MediaStream / null                     | null      |
| currentActiveRoomId   | Defines agent's active room                                | number / undefined                     | undefined |
| callStatus            | Calls' statuses                                            | { [key: string]: ICallStatus }         | {}        |
| callTime              | Calls' times                                               | { [key: string]: ITimeData }           | {}        |
| callMetrics           | Calls' metrics                                             | { [key: string]: unknown }             | {}        |
| autoAnswer            | Defines if auto-answer is enabled                          | boolean                                | false     |
| microphoneInputLevel  | Microphone sensitivity (range is from 0 to 2)              | number                                 | 2         |
| speakerVolume         | Speaker volume (range is from 0 to 1)                      | number                                 | 1         |

### Methods

| Name                     | Interface                                                  | Description                                                      |
| ------------------------ | :--------------------------------------------------------- | :--------------------------------------------------------------- |
| init                     | (domain: string, username: string, password: string): void | Initialize opensips-js                                           |
| initCall                 | (target: string, addToCurrentRoom: boolean) => void        | Make a call                                                      |
| answerCall               | (callId: string) => void                                   | Answer call                                                      |
| terminateCall            | (callId: string) => void                                   | Hangup call                                                      |
| muteCaller               | (callId: string) => void                                   | Mute caller                                                      |
| unmuteCaller             | (callId: string) => void                                   | Unmute caller                                                    |
| mute                     | () => void                                                 | Mute ourself                                                     |
| unmute                   | () => void                                                 | Unmute ourself                                                   |
| transferCall             | (callId: string, target: string) => void                   | Transfer call                                                    |
| mergeCall                | (roomId: number) => void                                   | Merge calls in room (works only when 2 call in room)             |
| holdCall                 | (callId: string, automatic?: boolean) => void              | Hold a call                                                      |
| unholdCall               | (callId: string) => void                                   | Unhold a call                                                    |
| moveCall                 | (callId: string, roomId: number) => Promise\<void>         | Move call to another room                                        |
| setMicrophone            | (deviceId: string) => Promise\<void>                       | Set microphone which to use                                      |
| setSpeaker               | (deviceId: string) => Promise\<void>                       | Set speaker which to use                                         |
| sendDTMF                 | (callId: string, value: string) => void                    | Send DTMF                                                        |
| setActiveRoom            | (roomId: number / undefined) => Promise\<void>             | Set current active room                                          |
| setMicrophoneSensitivity | (value: number) => void                                    | Set microphone sensitivity. Value should be in range from 0 to 1 |
| setSpeakerVolume         | (value: number) => void                                    | Set speaker volume. Value should be in range from 0 to 1         |
| setAutoAnswer            | (value: boolean) => void                                   | Set auto-answer                                                  |
| setDND                   | (state: boolean) => void                                   | Set 'Do not Disturb' option                                      |
| msrpAnswer               | (callId: string) => void                                   | Answer MSRP invite                                               |
| messageTerminate         | (callId: string) => void                                   | Terminate MSRP session                                           |
| sendMSRP                 | (msrpSessionId: string, body: string) => void              | Send MSRP message                                                |
| initMSRP                 | (target: string, body: string, options: object) => void    | Send MSRP invite                                                 |
