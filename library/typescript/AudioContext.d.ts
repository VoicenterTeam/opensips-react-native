import { MediaStream } from 'react-native-webrtc';
export declare class AudioContext {
    private stream;
    private destination;
    constructor();
    createMediaStreamSource(stream: any): {
        connect: (gainNode: MediaStream) => void;
    };
    createMediaStreamDestination(): {
        stream: null;
    };
    createGain(): {
        connect: (audioDestination: any) => void;
        gain: {
            value: number;
        };
    };
    createAnalyser(): {
        smoothingTimeConstant: number;
        fftSize: number;
        frequencyBinCount: number;
        connect: (javascriptNode: any) => void;
        getByteFrequencyData: (arr: Array<number>) => void;
    };
    createScriptProcessor(a: any, b: any, c: any): {
        connect: (destination: any) => void;
    };
}
//# sourceMappingURL=AudioContext.d.ts.map