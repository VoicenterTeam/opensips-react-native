import { MediaStream } from 'react-native-webrtc'
import { AudioNode } from './types/media'

export class AudioContext {
    private stream: MediaStream | null = null
    // @ts-expect-error: next-line
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private destination = null
    private startTime = Date.now()

    constructor () {}

    get currentTime (): number {
        return (Date.now() - this.startTime) / 1000
    }

    createMediaStreamSource (stream: MediaStream) {
        this.stream = stream
        const localStream = stream

        // connect method returns
        return {
            connect: (gainNode: MediaStream) => {
                try {
                    if (typeof gainNode === typeof MediaStream) {
                        localStream.getTracks().forEach((track) => {
                            gainNode.addTrack(track)
                        })
                    }
                } catch (error) {
                    console.warn('createMediaStreamSource error:', error)
                }
                // Here need to check if gainNode is MediaStream. If it is then:
                // Puts localStream into gainNode stream. So the gainNode stream wil have at leat 2 tracks:
                // The first one is localStream's track
                // The second one is gainNode's track
                // If gainNode is not MediaStream then do nothing
            },
        }
    }

    createMediaStreamDestination () {
        return {
            stream: this.stream,
        }
    }

    createGain () {
        return {
            // @ts-expect-error: next-line
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            connect (destinationNode: AudioNode, output?: number, input?: number) {},
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            disconnect () {},
            gain: {
                value: 0,
                // @ts-expect-error: next-line
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                cancelScheduledValues (startTime: number) {},
                // @ts-expect-error: next-line
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                setValueAtTime (value: number, startTime: number) {},
                // @ts-expect-error: next-line
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                linearRampToValueAtTime (value: number, endTime: number) {},
            },
        }
    }

    createAnalyser () {
        return {
            smoothingTimeConstant: 0.8,
            fftSize: 1024,
            frequencyBinCount: 1000,
            // @ts-expect-error: next-line
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            connect (destinationNode: AudioNode, output?: number, input?: number) {},
            // @ts-expect-error: next-line
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            getByteFrequencyData (array: Uint8Array) {},
        }
    }

    createOscillator () {
        return {
            frequency: {
                value: 440, // Default frequency in Hz
            },
            type: 'sine',
            // @ts-expect-error: next-line
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            connect (destinationNode: AudioNode, output?: number, input?: number) {},
            start () {
                // Stub implementation - no actual audio in React Native
            },
            stop () {
                // Stub implementation - no actual audio in React Native
            },
        }
    }

    // @ts-expect-error: next-line
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createScriptProcessor (bufferSize?: number, numberOfInputChannels?: number, numberOfOutputChannels?: number) {
        return {
            // @ts-expect-error: next-line
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            connect: function (destinationNode: AudioNode, output?: number, input?: number) {},
        }
    }
    async resume (): Promise<void> {
        return
    }
}