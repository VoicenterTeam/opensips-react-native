import React from "react";
import { createContext, useEffect, useState } from "react";
import OpenSIPSJS from "@voicenter-team/opensips-js";
let openSIPSJS = undefined;
export const ReactSipContext = /*#__PURE__*/createContext({});
export const ReactSipProvider = ({
  children
}) => {
  const [isInitialized, setInitialized] = useState(false);
  const [activeCalls, setActiveCalls] = useState({});
  const [activeMessages, setActiveMessages] = useState({});
  const [addCallToCurrentRoom, setAddCallToCurrentRoom] = useState(false);
  const [callAddingInProgress, setCallAddingInProgress] = useState(undefined);
  const [activeRooms, setActiveRooms] = useState({});
  const [msrpHistory, setMsrpHistory] = useState({});
  const [availableMediaDevices, setAvailableMediaDevices] = useState([]);
  const [selectedOutputDevice, setSelectedOutputDevice] = useState("default");
  const [selectedInputDevice, setSelectedInputDevice] = useState("default");
  const [muteWhenJoin, setMuteWhenJoin] = useState(false);
  const [isDND, setIsDnd] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [originalStream, setOriginalStream] = useState(null);
  const [currentActiveRoomId, setCurrentActiveRoomId] = useState(undefined);
  const [autoAnswer, setAutoAnswer] = useState(false);
  const [microphoneInputLevel, setMicrophoneInputLevel] = useState(1); // [0;1]
  const [speakerVolume, setSpeakerVolume] = useState(1); // [0;1]
  const [callStatus, setCallStatus] = useState({});
  const [callTime, setCallTime] = useState({});
  const [callMetrics, setCallMetrics] = useState({});
  const [callsInActiveRoom, setCallsInActiveRooms] = useState([]);
  const [outputMediaDeviceList, setOutputMediaDeviceList] = useState([]);
  const [inputMediaDeviceList, setInputMediaDeviceList] = useState([]);
  useEffect(() => {
    if (activeCalls && currentActiveRoomId) {
      const calls = Object.values(activeCalls)?.filter(call => call?.roomId === currentActiveRoomId);
      setCallsInActiveRooms(calls);
    }
  }, [activeCalls, currentActiveRoomId]);
  useEffect(() => {
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
  useEffect(() => {
    const selectInput = async () => {
      await reactSipAPI.actions.setMicrophone(selectedInputDevice);
    };
    selectInput();
  }, [selectedInputDevice]);
  useEffect(() => {
    const selectOutput = async () => {
      await reactSipAPI.actions.setSpeaker(selectedOutputDevice);
    };
    selectOutput();
  }, [selectedOutputDevice]);
  useEffect(() => {
    reactSipAPI.actions.setMuteWhenJoin(muteWhenJoin);
  }, [muteWhenJoin]);
  useEffect(() => {
    reactSipAPI.actions.setDND(isDND);
  }, [isDND]);
  useEffect(() => {
    reactSipAPI.actions.setDND(isDND);
  }, [isDND]);
  useEffect(() => {
    reactSipAPI.actions.setMicrophoneSensitivity(microphoneInputLevel);
  }, [microphoneInputLevel]);
  useEffect(() => {
    reactSipAPI.actions.setSpeakerVolume(speakerVolume);
  }, [speakerVolume]);
  useEffect(() => {
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
          openSIPSJS = new OpenSIPSJS({
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
  return /*#__PURE__*/React.createElement(ReactSipContext.Provider, {
    value: reactSipAPI
  }, children);
};
//# sourceMappingURL=ReactSipApiContext.js.map