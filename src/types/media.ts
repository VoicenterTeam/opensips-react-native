export type ChannelCountMode = 'clamped-max' | 'explicit' | 'max';
export type ChannelInterpretation = 'discrete' | 'speakers';
export type MediaDeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';

export interface AudioNode extends EventTarget {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioNode/channelCount) */
    channelCount: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioNode/channelCountMode) */
    channelCountMode: ChannelCountMode;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioNode/channelInterpretation) */
    channelInterpretation: ChannelInterpretation;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioNode/context) */
    readonly context: BaseAudioContext;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioNode/numberOfInputs) */
    readonly numberOfInputs: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioNode/numberOfOutputs) */
    readonly numberOfOutputs: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioNode/connect) */
    connect(destinationNode: AudioNode, output?: number, input?: number): AudioNode;
    connect(destinationParam: AudioParam, output?: number): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/AudioNode/disconnect) */
    disconnect(): void;
    disconnect(output: number): void;
    disconnect(destinationNode: AudioNode): void;
    disconnect(destinationNode: AudioNode, output: number): void;
    disconnect(destinationNode: AudioNode, output: number, input: number): void;
    disconnect(destinationParam: AudioParam): void;
    disconnect(destinationParam: AudioParam, output: number): void;
}

export interface MediaDeviceInfo {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/deviceId) */
    readonly deviceId: string;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/groupId) */
    readonly groupId: string;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/kind) */
    readonly kind: MediaDeviceKind;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/label) */
    readonly label: string;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/MediaDeviceInfo/toJSON) */
    toJSON(): object;
}
