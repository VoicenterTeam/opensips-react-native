import React, { useContext } from 'react'
import { createContext, useEffect, useState } from 'react'
import { type MediaDeviceOption, type ReactSipAPI } from '../types'
import {
    type ICallStatus,
    type ICall,
    type IRoom,
} from '@voicenter-team/opensips-js/src/types/rtc'
import { type ITimeData } from '@voicenter-team/opensips-js/src/types/timer'
import {
    IMessage,
    MSRPMessage,
} from '@voicenter-team/opensips-js/src/types/msrp'
import OpenSIPSJS from '@voicenter-team/opensips-js'
import { type MediaStream } from 'react-native-webrtc'
import { type MediaDeviceInfo } from '../types/media'
import { type MSRPMessageEventType } from '@voicenter-team/opensips-js/src/types/listeners'

let openSIPSJS: OpenSIPSJS | undefined = undefined
export const ReactSipContext = createContext<ReactSipAPI | undefined>(undefined)

export const ReactSipProvider = ({ children, }: {
  children: React.ReactNode;
}) => {
    const [ isInitialized, setInitialized ] = useState<boolean>(false)
    const [ activeCalls, setActiveCalls ] = useState<{ [key: string]: ICall }>({})
    const [ activeMessages, setActiveMessages ] = useState<{[key: string | number | symbol ]: IMessage}>({})
    const [ addCallToCurrentRoom, setAddCallToCurrentRoom ] =
    useState<boolean>(false)
    const [ callAddingInProgress, setCallAddingInProgress ] = useState<string | undefined>(undefined)
    const [ activeRooms, setActiveRooms ] = useState<{ [key: number]: IRoom }>({})
    const [ msrpHistory, setMsrpHistory ] = useState<{[key: string]: Array<MSRPMessage>;}>({})
    const [ availableMediaDevices, setAvailableMediaDevices ] = useState<Array<MediaDeviceInfo>>([])
    const [ selectedOutputDevice, setSelectedOutputDevice ] =
    useState<string>('default')
    const [ selectedInputDevice, setSelectedInputDevice ] =
    useState<string>('default')
    const [ muteWhenJoin, setMuteWhenJoin ] = useState<boolean>(false)
    const [ isDND, setIsDnd ] = useState<boolean>(false)
    const [ isMuted, setIsMuted ] = useState<boolean>(false)
    const [ originalStream, setOriginalStream ] = useState<MediaStream | null>(
        null
    )
    const [ currentActiveRoomId, setCurrentActiveRoomId ] = useState<number | undefined>(undefined)
    const [ autoAnswer, setAutoAnswer ] = useState<boolean>(false)
    const [ microphoneInputLevel, setMicrophoneInputLevel ] = useState<number>(1) // [0;1]
    const [ speakerVolume, setSpeakerVolume ] = useState<number>(1) // [0;1]
    const [ callStatus, setCallStatus ] = useState<{ [key: string]: ICallStatus }>(
        {}
    )
    const [ callTime, setCallTime ] = useState<{ [key: string]: ITimeData }>({})
    const [ callMetrics, setCallMetrics ] = useState<{ [key: string]: unknown }>(
        {}
    )
    const [ callsInActiveRoom, setCallsInActiveRooms ] = useState<ICall[]>([])
    const [ outputMediaDeviceList, setOutputMediaDeviceList ] = useState<MediaDeviceOption[]>([])
    const [ inputMediaDeviceList, setInputMediaDeviceList ] = useState<MediaDeviceOption[]>([])

    useEffect(() => {
        if (activeCalls && currentActiveRoomId) {
            const calls = Object.values(activeCalls)?.filter(
                (call) => call?.roomId === currentActiveRoomId
            )
            setCallsInActiveRooms(calls)
        }
    }, [ activeCalls, currentActiveRoomId ])

    useEffect(() => {
        if (availableMediaDevices) {
            const outputDevices = availableMediaDevices
                .filter((device) => device.kind === 'audiooutput')
                .map((device) => {
                    return {
                        deviceId: device.deviceId,
                        kind: device.kind,
                        groupId: device.groupId,
                        label: device.label,
                    }
                })
            const inputDevices = availableMediaDevices
                .filter((device) => device.kind === 'audioinput')
                .map((device) => {
                    return {
                        deviceId: device.deviceId,
                        kind: device.kind,
                        groupId: device.groupId,
                        label: device.label,
                    }
                })
            setOutputMediaDeviceList(outputDevices)
            setInputMediaDeviceList(inputDevices)
        }
    }, [ availableMediaDevices ])

    useEffect(() => {
        const selectInput = async () => {
            await reactSipAPI.actions.setMicrophone(selectedInputDevice)
        }
        selectInput()
    }, [ selectedInputDevice ])

    useEffect(() => {
        const selectOutput = async () => {
            await reactSipAPI.actions.setSpeaker(selectedOutputDevice)
        }
        selectOutput()
    }, [ selectedOutputDevice ])

    useEffect(() => {
        reactSipAPI.actions.setMuteWhenJoin(muteWhenJoin)
    }, [ muteWhenJoin ])

    useEffect(() => {
        reactSipAPI.actions.setDND(isDND)
    }, [ isDND ])

    useEffect(() => {
        reactSipAPI.actions.setDND(isDND)
    }, [ isDND ])

    useEffect(() => {
        reactSipAPI.actions.setMicrophoneSensitivity(microphoneInputLevel)
    }, [ microphoneInputLevel ])

    useEffect(() => {
        reactSipAPI.actions.setSpeakerVolume(speakerVolume)
    }, [ speakerVolume ])

    useEffect(() => {
        const changeActiveRoom = async () => {
            await reactSipAPI.actions.setActiveRoom(currentActiveRoomId)
        }
        changeActiveRoom()
    }, [ currentActiveRoomId ])

    const reactSipAPI: ReactSipAPI = {
        state: {
            isInitialized: isInitialized,
            activeCalls: activeCalls,
            callsInActiveRoom,
            activeMessages: activeMessages,
            addCallToCurrentRoom: addCallToCurrentRoom,
            callAddingInProgress: callAddingInProgress,
            activeRooms: activeRooms,
            msrpHistory: msrpHistory,
            availableMediaDevices: availableMediaDevices,
            inputMediaDeviceList,
            outputMediaDeviceList,
            selectedOutputDevice: selectedOutputDevice,
            selectedInputDevice: selectedInputDevice,
            muteWhenJoin: muteWhenJoin,
            isDND: isDND,
            isMuted: isMuted,
            originalStream: originalStream,
            currentActiveRoomId: currentActiveRoomId,
            callStatus: callStatus,
            callTime: callTime,
            callMetrics: callMetrics,
            autoAnswer: autoAnswer,
            microphoneInputLevel,
            speakerVolume: speakerVolume,
        },
        actions: {
            init (domain, username, password, pnExtraHeaders, pcConfig) {
                try {
                    openSIPSJS = new OpenSIPSJS({
                        configuration: {
                            session_timers: false,
                            uri: `sip:${username}@${domain}`,
                            password: password,
                        },
                        socketInterfaces: [ `wss://${domain}` ],
                        sipDomain: `${domain}`,
                        pnExtraHeaders: pnExtraHeaders,
                        sipOptions: {
                            session_timers: false,
                            extraHeaders: [ 'X-Bar: bar' ],
                            pcConfig: pcConfig ? pcConfig : {}
                        },
                        modules: ['audio']
                    })
                    /* openSIPSJS Listeners */
                    openSIPSJS
                        .on('ready', () => {
                            setAddCallToCurrentRoom(false)
                            setInitialized(true)
                        })
                        .on('changeActiveCalls', (sessions: { [key: string]: ICall }) => {
                            console.log('changeActiveCalls', sessions)
                            setActiveCalls({ ...sessions })
                        })
                        .on('changeActiveMessages', (sessions) => {
                            setActiveMessages({ ...sessions } as { [key: string]: IMessage })
                        })
                        .on(
                            'newMSRPMessage',
                            (data: MSRPMessageEventType) => {
                                const sessionId = data.session._id
                                const sessionMessages = msrpHistory[sessionId] || []
                                sessionMessages.push(data.message)
                                setMsrpHistory((prev) => ({
                                    ...prev,
                                    [sessionId]: [ ...sessionMessages ],
                                }))
                            }
                        )
                        .on('callAddingInProgressChanged', (value: string | undefined) => {
                            setCallAddingInProgress(value)
                        })
                        .on(
                            'changeAvailableDeviceList',
                            (devices) => {
                                setAvailableMediaDevices([ ...devices ])
                            }
                        )
                        .on('changeActiveInputMediaDevice', (data: string) => {
                            setSelectedInputDevice(data)
                        })
                        .on('changeActiveOutputMediaDevice', (data: string) => {
                            setSelectedOutputDevice(data)
                        })
                        .on('changeMuteWhenJoin', (value: boolean) => {
                            setMuteWhenJoin(value)
                        })
                        .on('changeIsDND', (value: boolean) => {
                            setIsDnd(value)
                        })
                        .on('changeIsMuted', (value: boolean) => {
                            setIsMuted(value)
                        })
                        .on('changeActiveStream', (value) => {
                            setOriginalStream(value)
                        })
                        .on('currentActiveRoomChanged', (id: number | undefined) => {
                            setCurrentActiveRoomId(id)
                        })
                        .on(
                            'addRoom',
                            ({ roomList }: { roomList: { [key: number]: IRoom } }) => {
                                setActiveRooms({ ...roomList })
                            }
                        )
                        .on(
                            'updateRoom',
                            ({ roomList }: { roomList: { [key: number]: IRoom } }) => {
                                setActiveRooms({ ...roomList })
                            }
                        )
                        .on(
                            'removeRoom',
                            ({ roomList }: { roomList: { [key: number]: IRoom } }) => {
                                setActiveRooms({ ...roomList })
                            }
                        )
                        .on('changeCallStatus', (data: { [key: string]: ICallStatus }) => {
                            setCallStatus({ ...data })
                        })
                        .on('changeCallTime', (data: { [key: string]: ITimeData }) => {
                            setCallTime({ ...data })
                        })
                        .on('changeCallMetrics', (data: { [key: string]: unknown }) => {
                            setCallMetrics({ ...data })
                        })
                        .begin()
                } catch (e) {
                    console.error(e)
                }
            },
            unregister () {
                openSIPSJS?.unregister()
            },
            initCall (target: string, addToCurrentRoom = false) {
                openSIPSJS?.audio.initCall(target, addToCurrentRoom)
            },
            answerCall (callId: string) {
                openSIPSJS?.audio.answerCall(callId)
            },
            terminateCall (callId: string) {
                openSIPSJS?.audio.terminateCall(callId)
            },
            mute () {
                openSIPSJS?.audio.mute()
            },
            unmute () {
                openSIPSJS?.audio.unmute()
            },
            transferCall (callId: string, target: string) {
                openSIPSJS?.audio.transferCall(callId, target)
            },
            mergeCall (roomId: number) {
                openSIPSJS?.audio.mergeCall(roomId)
            },
            holdCall (callId: string, automatic?: boolean) {
                openSIPSJS?.audio.holdCall(callId, automatic)
            },
            unholdCall (callId: string) {
                openSIPSJS?.audio.unholdCall(callId)
            },
            async moveCall (callId: string, roomId: number) {
                await openSIPSJS?.audio.moveCall(callId, roomId)
            },
            muteCaller (callId: string) {
                openSIPSJS?.audio.muteCaller(callId)
            },
            unmuteCaller (callId: string) {
                openSIPSJS?.audio.unmuteCaller(callId)
            },
            setMuteWhenJoin (state: boolean) {
                openSIPSJS?.audio.setMuteWhenJoin(state)
            },
            setDND (state: boolean) {
                openSIPSJS?.audio.setDND(state)
            },
            async setMicrophone (deviceId: string) {
                await openSIPSJS?.audio.setMicrophone(deviceId)
            },
            async setSpeaker (deviceId: string) {
                await openSIPSJS?.audio.setSpeaker(deviceId)
            },
            sendDTMF (callId: string, value: string) {
                openSIPSJS?.audio.sendDTMF(callId, value)
            },
            async setActiveRoom (roomId: number | undefined) {
                await openSIPSJS?.audio.setActiveRoom(roomId)
            },
            setMicrophoneSensitivity (value: number) {
                setMicrophoneInputLevel(value)
                openSIPSJS?.audio.setMicrophoneSensitivity(value)
            },
            setSpeakerVolume (value: number) {
                setSpeakerVolume(value)
                openSIPSJS?.audio.setSpeakerVolume(value)
            },
            setAutoAnswer (value: boolean) {
                setAutoAnswer(value)
                openSIPSJS?.audio.setAutoAnswer(value)
            },
            msrpAnswer (callId: string) {
                openSIPSJS?.msrp.msrpAnswer(callId)
            },
            messageTerminate (callId: string) {
                openSIPSJS?.msrp.messageTerminate(callId)
            },
            sendMSRP (msrpSessionId: string, body: string) {
                openSIPSJS?.msrp.sendMSRP(msrpSessionId, body)
            },
            initMSRP (target: string, body: string, options: object) {
                openSIPSJS?.msrp.initMSRP(target, body, options)
            },
            stop () {
                openSIPSJS?.stop()
            },
            mergeCallByIds(firstCallId: string, secondCallId: string) {
                openSIPSJS?.audio.mergeCallByIds(firstCallId, secondCallId)
            }
        },
    }
    return (
        <ReactSipContext.Provider value={reactSipAPI}>
            {children}
        </ReactSipContext.Provider>
    )
}

export const useReactSip = (): ReactSipAPI => {
    const context = useContext(ReactSipContext)
    if (context === undefined) {
        throw new Error('useReactSip must be used within a UserProvider')
    }
    return context
}
