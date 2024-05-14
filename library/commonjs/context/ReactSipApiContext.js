"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ReactSipProvider = exports.ReactSipContext = void 0;
var _react = _interopRequireWildcard(require("react"));
var _opensipsJs = _interopRequireDefault(require("@voicenter-team/opensips-js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
let openSIPSJS = undefined;
const ReactSipContext = exports.ReactSipContext = /*#__PURE__*/(0, _react.createContext)({});
const ReactSipProvider = ({
  children
}) => {
  const [isInitialized, setInitialized] = (0, _react.useState)(false);
  const [activeCalls, setActiveCalls] = (0, _react.useState)({});
  const [activeMessages, setActiveMessages] = (0, _react.useState)({});
  const [addCallToCurrentRoom, setAddCallToCurrentRoom] = (0, _react.useState)(false);
  const [callAddingInProgress, setCallAddingInProgress] = (0, _react.useState)(undefined);
  const [activeRooms, setActiveRooms] = (0, _react.useState)({});
  const [msrpHistory, setMsrpHistory] = (0, _react.useState)({});
  const [availableMediaDevices, setAvailableMediaDevices] = (0, _react.useState)([]);
  const [selectedOutputDevice, setSelectedOutputDevice] = (0, _react.useState)("default");
  const [selectedInputDevice, setSelectedInputDevice] = (0, _react.useState)("default");
  const [muteWhenJoin, setMuteWhenJoin] = (0, _react.useState)(false);
  const [isDND, setIsDnd] = (0, _react.useState)(false);
  const [isMuted, setIsMuted] = (0, _react.useState)(false);
  const [originalStream, setOriginalStream] = (0, _react.useState)(null);
  const [currentActiveRoomId, setCurrentActiveRoomId] = (0, _react.useState)(undefined);
  const [autoAnswer, setAutoAnswer] = (0, _react.useState)(false);
  const [microphoneInputLevel, setMicrophoneInputLevel] = (0, _react.useState)(1); // [0;1]
  const [speakerVolume, setSpeakerVolume] = (0, _react.useState)(1); // [0;1]
  const [callStatus, setCallStatus] = (0, _react.useState)({});
  const [callTime, setCallTime] = (0, _react.useState)({});
  const [callMetrics, setCallMetrics] = (0, _react.useState)({});
  const [callsInActiveRoom, setCallsInActiveRooms] = (0, _react.useState)([]);
  const [outputMediaDeviceList, setOutputMediaDeviceList] = (0, _react.useState)([]);
  const [inputMediaDeviceList, setInputMediaDeviceList] = (0, _react.useState)([]);
  (0, _react.useEffect)(() => {
    if (activeCalls && currentActiveRoomId) {
      const calls = Object.values(activeCalls)?.filter(call => call?.roomId === currentActiveRoomId);
      setCallsInActiveRooms(calls);
    }
  }, [activeCalls, currentActiveRoomId]);
  (0, _react.useEffect)(() => {
    if (availableMediaDevices) {
      const outputDevices = availableMediaDevices.filter(device => device.kind === "audiooutput").map(device => {
        return {
          deviceId: device.deviceId,
          kind: device.kind,
          groupId: device.groupId,
          label: device.label
        };
      });
      const inputDevices = availableMediaDevices.filter(device => device.kind === "audioinput").map(device => {
        return {
          deviceId: device.deviceId,
          kind: device.kind,
          groupId: device.groupId,
          label: device.label
        };
      });
      setOutputMediaDeviceList(outputDevices);
      setInputMediaDeviceList(inputDevices);
    }
  }, [availableMediaDevices]);
  (0, _react.useEffect)(() => {
    const selectInput = async () => {
      await reactSipAPI.actions.setMicrophone(selectedInputDevice);
    };
    selectInput();
  }, [selectedInputDevice]);
  (0, _react.useEffect)(() => {
    const selectOutput = async () => {
      await reactSipAPI.actions.setSpeaker(selectedOutputDevice);
    };
    selectOutput();
  }, [selectedOutputDevice]);
  (0, _react.useEffect)(() => {
    reactSipAPI.actions.setMuteWhenJoin(muteWhenJoin);
  }, [muteWhenJoin]);
  (0, _react.useEffect)(() => {
    reactSipAPI.actions.setDND(isDND);
  }, [isDND]);
  (0, _react.useEffect)(() => {
    reactSipAPI.actions.setDND(isDND);
  }, [isDND]);
  (0, _react.useEffect)(() => {
    reactSipAPI.actions.setMicrophoneSensitivity(microphoneInputLevel);
  }, [microphoneInputLevel]);
  (0, _react.useEffect)(() => {
    reactSipAPI.actions.setSpeakerVolume(speakerVolume);
  }, [speakerVolume]);
  (0, _react.useEffect)(() => {
    const changeActiveRoom = async () => {
      await reactSipAPI.actions.setActiveRoom(currentActiveRoomId);
    };
    changeActiveRoom();
  }, [currentActiveRoomId]);
  const reactSipAPI = {
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
      speakerVolume: speakerVolume
    },
    actions: {
      init(domain, username, password, pcConfig) {
        try {
          openSIPSJS = new _opensipsJs.default({
            configuration: {
              session_timers: false,
              uri: `sip:${username}@${domain}`,
              password: password
            },
            socketInterfaces: [`wss://${domain}`],
            sipDomain: `${domain}`,
            sipOptions: {
              session_timers: false,
              extraHeaders: ["X-Bar: bar"],
              pcConfig: pcConfig ? pcConfig : {}
            }
          });
          /* openSIPSJS Listeners */
          openSIPSJS.on("ready", () => {
            setAddCallToCurrentRoom(false);
            setInitialized(true);
          }).on("changeActiveCalls", sessions => {
            console.log("changeActiveCalls", sessions);
            setActiveCalls({
              ...sessions
            });
          }).on("changeActiveMessages", sessions => {
            setActiveMessages({
              ...sessions
            });
          }).on("newMSRPMessage", data => {
            const sessionId = data.session._id;
            const sessionMessages = msrpHistory[sessionId] || [];
            sessionMessages.push(data.message);
            setMsrpHistory(prev => ({
              ...prev,
              [sessionId]: [...sessionMessages]
            }));
          }).on("callAddingInProgressChanged", value => {
            setCallAddingInProgress(value);
          }).on("changeAvailableDeviceList", devices => {
            setAvailableMediaDevices([...devices]);
          }).on("changeActiveInputMediaDevice", data => {
            setSelectedInputDevice(data);
          }).on("changeActiveOutputMediaDevice", data => {
            setSelectedOutputDevice(data);
          }).on("changeMuteWhenJoin", value => {
            setMuteWhenJoin(value);
          }).on("changeIsDND", value => {
            setIsDnd(value);
          }).on("changeIsMuted", value => {
            setIsMuted(value);
          }).on("changeActiveStream", value => {
            setOriginalStream(value);
          }).on("currentActiveRoomChanged", id => {
            setCurrentActiveRoomId(id);
          }).on("addRoom", ({
            roomList
          }) => {
            setActiveRooms({
              ...roomList
            });
          }).on("updateRoom", ({
            roomList
          }) => {
            setActiveRooms({
              ...roomList
            });
          }).on("removeRoom", ({
            roomList
          }) => {
            setActiveRooms({
              ...roomList
            });
          }).on("changeCallStatus", data => {
            setCallStatus({
              ...data
            });
          }).on("changeCallTime", data => {
            setCallTime({
              ...data
            });
          }).on("changeCallMetrics", data => {
            setCallMetrics({
              ...data
            });
          }).begin();
        } catch (e) {
          console.error(e);
        }
      },
      initCall(target, addToCurrentRoom = false) {
        openSIPSJS?.initCall(target, addToCurrentRoom);
      },
      answerCall(callId) {
        openSIPSJS?.answerCall(callId);
      },
      terminateCall(callId) {
        openSIPSJS?.terminateCall(callId);
      },
      mute() {
        openSIPSJS?.mute();
      },
      unmute() {
        openSIPSJS?.unmute();
      },
      transferCall(callId, target) {
        openSIPSJS?.transferCall(callId, target);
      },
      mergeCall(roomId) {
        openSIPSJS?.mergeCall(roomId);
      },
      holdCall(callId, automatic) {
        openSIPSJS?.holdCall(callId, automatic);
      },
      unholdCall(callId) {
        openSIPSJS?.unholdCall(callId);
      },
      async moveCall(callId, roomId) {
        await openSIPSJS?.moveCall(callId, roomId);
      },
      muteCaller(callId) {
        openSIPSJS?.muteCaller(callId);
      },
      unmuteCaller(callId) {
        openSIPSJS?.unmuteCaller(callId);
      },
      setMuteWhenJoin(state) {
        openSIPSJS?.setMuteWhenJoin(state);
      },
      setDND(state) {
        openSIPSJS?.setDND(state);
      },
      async setMicrophone(deviceId) {
        await openSIPSJS?.setMicrophone(deviceId);
      },
      async setSpeaker(deviceId) {
        await openSIPSJS?.setSpeaker(deviceId);
      },
      sendDTMF(callId, value) {
        openSIPSJS?.sendDTMF(callId, value);
      },
      async setActiveRoom(roomId) {
        await openSIPSJS?.setActiveRoom(roomId);
      },
      setMicrophoneSensitivity(value) {
        setMicrophoneInputLevel(value);
        openSIPSJS?.setMicrophoneSensitivity(value);
      },
      setSpeakerVolume(value) {
        setSpeakerVolume(value);
        openSIPSJS?.setSpeakerVolume(value);
      },
      setAutoAnswer(value) {
        setAutoAnswer(value);
        openSIPSJS?.setAutoAnswer(value);
      },
      msrpAnswer(callId) {
        openSIPSJS?.msrpAnswer(callId);
      },
      messageTerminate(callId) {
        openSIPSJS?.messageTerminate(callId);
      },
      sendMSRP(msrpSessionId, body) {
        openSIPSJS?.sendMSRP(msrpSessionId, body);
      },
      initMSRP(target, body, options) {
        openSIPSJS?.initMSRP(target, body, options);
      }
    }
  };
  return /*#__PURE__*/_react.default.createElement(ReactSipContext.Provider, {
    value: reactSipAPI
  }, children);
};
exports.ReactSipProvider = ReactSipProvider;
//# sourceMappingURL=ReactSipApiContext.js.map