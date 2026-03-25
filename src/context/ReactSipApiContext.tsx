// @ts-nocheck
import React, { useContext } from 'react'
import { createContext, useEffect, useState } from 'react'
import { ConnectionStausEnum, type MediaDeviceOption, type ReactSipAPI, type NoiseReductionOptions } from '../types'
import {
    type ICallStatus,
    type ICall,
    type IRoom,
} from 'opensips-js/src/types/rtc'
import { type ITimeData } from 'opensips-js/src/types/timer'
import {
    IMessage,
    MSRPMessage,
} from 'opensips-js/src/types/msrp'
import { WebrtcMetricsConfigType } from 'opensips-js/src/types/webrtcmetrics'
import OpenSIPSJS from 'opensips-js'
import { type MediaStream, type RTCPeerConnection } from 'react-native-webrtc'
import { type MediaDeviceInfo } from '../types/media'
import { type MSRPMessageEventType } from 'opensips-js/src/types/listeners'
import { StatsBasedVAD } from '../utils/statsBasedVAD'

export let openSIPSJS: OpenSIPSJS | undefined = undefined
export const ReactSipContext = createContext<ReactSipAPI | undefined>(undefined)

export const ReactSipProvider = ({ children, }: {
    children: React.ReactNode;
}) => {
    const [ connectionStatus, setConnectionStatus ] = useState<ConnectionStausEnum>(ConnectionStausEnum.DISCONNECTED)
    const [ isInitialized, setInitialized ] = useState<boolean>(false)
    const [ allCalls, setAllCalls ] = useState<{ [key: string]: ICall }>({})
    const [ activeMessages, setActiveMessages ] = useState<{ [key: string | number | symbol]: IMessage }>({})
    const [ addCallToCurrentRoom, setAddCallToCurrentRoom ] =
        useState<boolean>(false)
    const [ callAddingInProgress, setCallAddingInProgress ] = useState<string | undefined>(undefined)
    const [ allRooms, setAllRooms ] = useState<{ [key: number | string]: IRoom }>({})
    const [ msrpHistory, setMsrpHistory ] = useState<{ [key: string]: Array<MSRPMessage>; }>({})
    const [ availableMediaDevices, setAvailableMediaDevices ] = useState<Array<MediaDeviceInfo>>([])
    const [ selectedOutputDevice, setSelectedOutputDevice ] =
        useState<string>('default')
    const [ selectedInputDevice, setSelectedInputDevice ] = useState<string>('default')
    const [ muteWhenJoin, setMuteWhenJoin ] = useState<boolean>(false)
    const [ isDND, setIsDnd ] = useState<boolean>(false)
    const [ isMuted, setIsMuted ] = useState<boolean>(false)
    const [ originalStream, setOriginalStream ] = useState<MediaStream | null>(
        null
    )
    const [ currentActiveRoomId, setCurrentActiveRoomId ] = useState<number | undefined>(undefined)
    const [ autoAnswer, setAutoAnswer ] = useState<boolean>(false)
    const [ callWaiting, setCallWaiting ] = useState<boolean>(true)
    const [ microphoneInputLevel, setMicrophoneInputLevel ] = useState<number>(1) // [0;1]
    const [ speakerVolume, setSpeakerVolume ] = useState<number>(1) // [0;1]
    const [ callStatus, setCallStatus ] = useState<{ [key: string]: ICallStatus }>(
        {}
    )
    const [ callTime, setCallTime ] = useState<{ [key: string]: ITimeData }>({})
    const [ callMetrics, setCallMetrics ] = useState<{ [key: string]: unknown }>(
        {}
    )
    const [ outputMediaDeviceList, setOutputMediaDeviceList ] = useState<MediaDeviceOption[]>([])
    const [ inputMediaDeviceList, setInputMediaDeviceList ] = useState<MediaDeviceOption[]>([])

    const JSSIP_STATUS_CONFIRMED = 9

    const noiseReductionRef = React.useRef<{
        options: NoiseReductionOptions | null;
        enabled: boolean;
        vadMap: Map<string, StatsBasedVAD>;
        activeCallCountRef: { current: number };
        runPlatformSetup: (() => Promise<void>) | null;
        teardown: (() => void) | null;
        applyToSession: ((session: { _id?: string; _connection?: RTCPeerConnection; _status?: number; on: (e: string, h: (ev: unknown) => void) => void }) => void) | null;
    }>({
        options: null,
        enabled: false,
        vadMap: new Map(),
        activeCallCountRef: { current: 0 },
        runPlatformSetup: null,
        teardown: null,
        applyToSession: null,
    })

    const activeCalls = React.useMemo(() => {
        const calls: { [key: string]: ICall } = {}
        Object.entries(allCalls).forEach(([ key, value ]) => {
            if (!callStatus[key]?.isTransferred) {
                calls[key] = value
            }
        })
        return calls
    }, [ allCalls, callStatus ])

    const activeRooms = React.useMemo(() => {
        const rooms: { [key: number | string]: IRoom } = {}
        const callRoomIds = Object.values(activeCalls).map((call) => {
            return call.roomId
        })
        Object.entries(allRooms).forEach(([ key, value ]) => {
            if (callRoomIds.includes(value.roomId)) {
                rooms[key] = value
            }
        })
        return rooms
    }, [ activeCalls, allRooms ])

    const callsInActiveRoom = React.useMemo(() => {
        return Object.values(activeCalls).filter((call) => call.roomId === currentActiveRoomId)
    }, [ activeCalls, currentActiveRoomId ])

    useEffect(() => {
        if (!callsInActiveRoom.length && currentActiveRoomId) {
            setCurrentActiveRoomId(undefined)
        }
    }, [ callsInActiveRoom, currentActiveRoomId ])

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
            connectionStatus: connectionStatus,
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
            callWaiting: callWaiting,
        },
        actions: {
            init ( domain, username, password, pnExtraHeaders, pcConfig, onTransportCallback, reconnectionAttemptsLimit, existingInstance = null, noiseReductionOptions: NoiseReductionOptions) {
                setConnectionStatus(ConnectionStausEnum.CONNECTING)
                return new Promise((resolve, reject) => {
                    const isNoiseReductionEnabled = noiseReductionOptions?.enabled === true

                    const vadMap = new Map<string, StatsBasedVAD>()
                    const activeCallCountRef = { current: 0 }

                    noiseReductionRef.current.options = noiseReductionOptions ?? null
                    noiseReductionRef.current.enabled = isNoiseReductionEnabled
                    noiseReductionRef.current.vadMap = vadMap
                    noiseReductionRef.current.activeCallCountRef = activeCallCountRef

                    const monitorDTXEffectiveness = async (pc: RTCPeerConnection) => {
                        let prevPackets = 0, prevBytes = 0, prevTimestamp = Date.now();

                        setInterval(async () => {
                          const stats = await pc.getStats();
                          stats.forEach((report: { type?: string; kind?: string; packetsSent?: number; bytesSent?: number }) => {
                            if (report.type === 'outbound-rtp' && report.kind === 'audio' && report.packetsSent != null && report.bytesSent != null) {
                              const now = Date.now();
                              const elapsed = (now - prevTimestamp) / 1000;
                              const pps = (report.packetsSent - prevPackets) / elapsed;
                              const kbps = ((report.bytesSent - prevBytes) * 8) / elapsed / 1000;

                              console.log(`[DTX] ${pps.toFixed(1)} pkt/s | ${kbps.toFixed(1)} kbps`);
                              // Active speech: ~50 pkt/s, ~30-40 kbps
                              // DTX silence:   ~2.5 pkt/s, ~0.5 kbps

                              prevPackets = report.packetsSent;
                              prevBytes = report.bytesSent;
                              prevTimestamp = now;
                            }
                          });
                        }, 2000);
                    }

                    const _setupSdpInterceptor = () => {
                        if (!openSIPSJS || typeof openSIPSJS.on !== 'function') {
                            if (noiseReductionRef.current.options) {
                                console.warn('[ReactSip] JsSIP UA not accessible — InCallManager and VAD hooks will not be applied')
                            }
                            return
                        }
                        openSIPSJS.on('newRTCSession', (data: unknown) => {
                            const ref = noiseReductionRef.current
                            if (!ref.enabled || !ref.options) return
                            const { InCallManager } = ref.options
                            const { session } = (data as { session?: { _id?: string; _connection?: RTCPeerConnection; _status?: number; on: (e: string, h: (ev: unknown) => void) => void } })
                            if (!session) return

                            const sessionWithConnection = session as { _connection?: RTCPeerConnection }
                            if (sessionWithConnection._connection) {
                                ref.applyToSession?.(session)
                            }

                            session.on('peerconnection', () => {
                                ref.applyToSession?.(session)
                            })

                            session.on('confirmed', () => {
                                ref.activeCallCountRef.current++
                                if (ref.activeCallCountRef.current === 1) {
                                    InCallManager?.start({ media: 'audio' })
                                }
                            })
                        })
                    }

                    const runPlatformSetup = (): Promise<void> => {
                        const opts = noiseReductionRef.current.options
                        if (!opts) return Promise.resolve()
                        const { Platform, AudioConfig, AudioSessionManager } = opts
                        if (Platform.OS === 'android') {
                            return AudioConfig.getAudioCapabilities().then((caps) => {
                                console.log('[Audio] Android:', caps.manufacturer, caps.device)
                            })
                        }
                        if (Platform.OS === 'ios') {
                            return AudioSessionManager.configureForVoIP(false).then((result) => {
                                console.log('[Audio] iOS echo cancelled:', result.echoCancelled)
                            })
                        }
                        return Promise.resolve()
                    }

                    const teardown = () => {
                        const r = noiseReductionRef.current
                        r.vadMap.forEach((v) => v.stop())
                        r.vadMap.clear()
                        r.activeCallCountRef.current = 0
                    }

                    const applyNoiseReductionToSession = (session: { _id?: string; _connection?: RTCPeerConnection; _status?: number; on: (e: string, h: (ev: unknown) => void) => void }) => {
                        const sessionId = session._id ?? ''
                        const pc = session._connection
                        if (!pc) return
                        const r = noiseReductionRef.current
                        if (!r.options) return
                        if (r.vadMap.has(sessionId)) return
                        const { InCallManager, AudioConfig } = r.options
                        const isConfirmed = session._status === JSSIP_STATUS_CONFIRMED
                        const vad = new StatsBasedVAD(pc, {
                            pollIntervalMs: 200,
                            speechThreshold: 0.01,
                            silenceThreshold: 0.005,
                            speechMinDurationMs: 250,
                            silenceMinDurationMs: 600,
                            onSpeechStart: () => console.log('[VAD] Speaking'),
                            onSpeechEnd: () => console.log('[VAD] Silent'),
                            onAudioLevel: (level) => {
                                const dB = 20 * Math.log10(level || 0.0001)
                                console.log(`[VAD] Audio level: ${level.toFixed(4)} (${dB.toFixed(1)} dB)`)
                            },
                        })
                        vad.start()
                        r.vadMap.set(sessionId, vad)
                        monitorDTXEffectiveness(pc)
                        if (isConfirmed) {
                            r.activeCallCountRef.current++
                            if (r.activeCallCountRef.current === 1) {
                                InCallManager?.start({ media: 'audio' })
                            }
                        }
                        const onSessionEnd = () => {
                            r.vadMap.get(sessionId)?.stop()
                            r.vadMap.delete(sessionId)
                            r.activeCallCountRef.current--
                            if (r.activeCallCountRef.current <= 0) {
                                r.activeCallCountRef.current = 0
                                InCallManager?.stop()
                                AudioConfig?.resetAudioMode?.()
                            }
                        }
                        session.on('ended', onSessionEnd)
                        session.on('failed', onSessionEnd)
                    }

                    noiseReductionRef.current.runPlatformSetup = runPlatformSetup
                    noiseReductionRef.current.teardown = teardown
                    noiseReductionRef.current.applyToSession = applyNoiseReductionToSession

                    const platformSetupPromise = isNoiseReductionEnabled ? runPlatformSetup() : Promise.resolve()
                    platformSetupPromise.then(() => {
                            if (existingInstance) {
                                openSIPSJS = existingInstance
                            } else {
                                openSIPSJS = new OpenSIPSJS({
                                configuration: {
                                    session_timers: false,
                                    uri: `sip:${username}@${domain}`,
                                    password: password,
                                    reconnectionAttemptsLimit,
                                    onTransportCallback,
                                    noiseReductionOptions: {
                                        mode: 'disabled',
                                        noiseThreshold: 0.004,
                                        checkEveryMs: 500,
                                        noiseCheckInterval: 2000
                                    },
                                },
                                socketInterfaces: [ `wss://${domain}` ],
                                sipDomain: `${domain}`,
                                pnExtraHeaders: pnExtraHeaders,
                                sipOptions: {
                                    session_timers: false,
                                    extraHeaders: [ 'X-Bar: bar' ],
                                    pcConfig: pcConfig ? pcConfig : {}
                                },
                                modules: [ 'audio' ]
                            })
                        }
                        /* openSIPSJS Listeners */
                        openSIPSJS
                            .on('ready', () => {
                                setAddCallToCurrentRoom(false)
                                setInitialized(true)
                                resolve(openSIPSJS)
                            })
                            .on('changeActiveCalls', (sessions: { [key: string]: ICall }) => {
                                console.log('changeActiveCalls', sessions)
                                setAllCalls({ ...sessions })
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
                                ({ roomList }: { roomList: { [key: number | string]: IRoom } }) => {
                                    setAllRooms({ ...roomList })
                                }
                            )
                            .on(
                                'updateRoom',
                                ({ roomList }: { roomList: { [key: number | string]: IRoom } }) => {
                                    setAllRooms({ ...roomList })
                                }
                            )
                            .on(
                                'removeRoom',
                                ({ roomList }: { roomList: { [key: number | string]: IRoom } }) => {
                                    setAllRooms({ ...roomList })
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
                            .on('connecting', () => {
                                setConnectionStatus(ConnectionStausEnum.CONNECTING)
                            })
                            .on('connection', (status) => {
                                if (status) {
                                    setConnectionStatus(ConnectionStausEnum.CONNECTED)
                                } else {
                                    setConnectionStatus(ConnectionStausEnum.DISCONNECTED)
                                }
                            })
                        if (!existingInstance) {
                            _setupSdpInterceptor()

                            openSIPSJS.begin()
                        } else {
                            if (openSIPSJS.initialized) {
                                setAddCallToCurrentRoom(false)
                                setInitialized(true)
                                if (openSIPSJS.audio?.getActiveCalls) {
                                    setAllCalls({ ...openSIPSJS.audio.getActiveCalls })
                                }
                                if (openSIPSJS.audio?.getActiveRooms) {
                                    setAllRooms({ ...openSIPSJS.audio.getActiveRooms })
                                }
                                if(openSIPSJS.isConnected()) {
                                    setConnectionStatus(ConnectionStausEnum.CONNECTED)
                                }
                                resolve(openSIPSJS)
                            }
                        }
                    })
                    .catch((e) => {
                        reject()
                        console.error(e)
                    })
                })
            },
            unregister () {
                openSIPSJS?.unregister()
            },
            register () {
                openSIPSJS?.register()
            },
            initCall (target: string, addToCurrentRoom = false, holdOtherCalls = false) {
                try {
                    openSIPSJS?.audio.initCall(target, addToCurrentRoom, holdOtherCalls)
                } catch (error) {
                    console.warn(error, 'Init call error')
                }
            },
            setNoiseReductionMode (mode: boolean) {
                const ref = noiseReductionRef.current
                if (!ref.options) return
                ref.enabled = mode
                if (mode) {
                    ref.runPlatformSetup?.()
                    const sessions = openSIPSJS?._sessions ? Object.values(openSIPSJS._sessions) : []
                    sessions.forEach((session) => {
                        if (session._connection) {
                            ref.applyToSession?.(session)
                            if (typeof session.renegotiate === 'function') {
                                session.renegotiate()
                            }
                        }
                    })
                } else {
                    const sessions = openSIPSJS?._sessions ? Object.values(openSIPSJS._sessions) : []
                    sessions.forEach((session) => {
                        if (session._connection && typeof session.renegotiate === 'function') {
                            session.renegotiate()
                        }
                    })
                    ref.teardown?.()
                }
            },
            answerCall (callId: string) {
                try {
                    openSIPSJS?.audio.answerCall(callId)
                } catch (error) {
                    console.warn(error, 'Answer call error')
                }
            },
            terminateCall (callId: string) {
                try {
                    openSIPSJS?.audio.terminateCall(callId)
                } catch (error) {
                    console.warn(error, 'Terminate call error')
                }
            },
            mute () {
                try {
                    openSIPSJS?.audio.mute()
                } catch (error) {
                    console.warn(error, 'Mute error')
                }
            },
            unmute () {
                try {
                    openSIPSJS?.audio.unmute()
                } catch (error) {
                    console.warn(error, 'Unmute error')
                }
            },
            transferCall (callId: string, target: string) {
                try {
                    openSIPSJS?.audio.transferCall(callId, target)
                } catch (error) {
                    console.warn(error, 'Transfer call error')
                }
            },
            mergeCall (roomId: number) {
                try {
                    openSIPSJS?.audio.mergeCall(roomId)
                } catch (error) {
                    console.warn(error, 'Merge call error')
                }
            },
            holdCall (callId: string, automatic?: boolean) {
                try {
                    openSIPSJS?.audio.holdCall(callId, automatic)
                } catch (error) {
                    console.warn(error, 'Hold call error')
                }
            },
            unholdCall (callId: string) {
                try {
                    openSIPSJS?.audio.unholdCall(callId)
                } catch (error) {
                    console.warn(error, 'Unhold call error')
                }
            },
            async moveCall (callId: string, roomId: number) {
                try {
                    await openSIPSJS?.audio.moveCall(callId, roomId)
                } catch (error) {
                    console.warn(error, 'Move call error')
                }
            },
            muteCaller (callId: string) {
                try {
                    openSIPSJS?.audio.muteCaller(callId)
                } catch (error) {
                    console.warn(error, 'Mute caller error')
                }
            },
            unmuteCaller (callId: string) {
                try {
                    openSIPSJS?.audio.unmuteCaller(callId)
                } catch (error) {
                    console.warn(error, 'Unmute caller error')
                }
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
                try {
                    openSIPSJS?.audio.sendDTMF(callId, value)
                } catch (error) {
                    console.warn(error, 'DTMF error')
                }
            },
            async setActiveRoom (roomId: number | undefined) {
                try {
                    await openSIPSJS?.audio.setActiveRoom(roomId)
                } catch (error) {
                    console.warn(error, 'Set active room error')
                }
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
            mergeCallByIds (firstCallId: string, secondCallId: string) {
                try {
                    openSIPSJS?.audio.mergeCallByIds(firstCallId, secondCallId)
                } catch (error) {
                    console.warn(error, 'Merge calls by ids error')
                }
            },
            setCallWaiting (value: boolean) {
                setCallWaiting(value)
                openSIPSJS?.audio.setCallWaiting(value)
            },
            disconnect () {
                openSIPSJS?.disconnect()
            },
            setMetricsConfig (config: WebrtcMetricsConfigType) {
                openSIPSJS?.audio.setMetricsConfig(config)
            },
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
