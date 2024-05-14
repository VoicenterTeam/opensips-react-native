//@ts-nocheck
import { MediaStream } from 'react-native-webrtc';
export class AudioContext {
  stream = null;
  destination = null;
  constructor() {}
  createMediaStreamSource(stream) {
    this.stream = stream;
    const localStream = stream;
    // connect method returns
    return {
      connect: gainNode => {
        try {
          if (typeof gainNode === typeof MediaStream) {
            console.log(gainNode, 'node');
            localStream.getTracks().forEach(track => {
              gainNode.addTrack(track);
            });
          }
        } catch (error) {
          console.warn('createMediaStreamSource error:', error);
        }
        // Here need to check if gainNode is MediaStream. If it is then:
        // Puts localStream into gainNode stream. So the gainNode stream wil have at leat 2 tracks:
        // The first one is localStream's track
        // The second one is gainNode's track
        // If gainNode is not MediaStream then do nothing
      }
    };
  }
  createMediaStreamDestination() {
    return {
      stream: this.stream
    };
  }
  createGain() {
    return {
      connect: function (audioDestination) {},
      gain: {
        value: 0
      }
    };
  }
  createAnalyser() {
    return {
      smoothingTimeConstant: 0.8,
      fftSize: 1024,
      frequencyBinCount: 1000,
      connect: function (javascriptNode) {},
      getByteFrequencyData: function (arr) {}
    };
  }
  //   createMediaStreamSource(stream) {
  //     return {
  //       connect: function (analyser) {},
  //     };
  //   }
  createScriptProcessor(a, b, c) {
    return {
      connect: function (destination) {}
    };
  }
}
//# sourceMappingURL=AudioContext.js.map