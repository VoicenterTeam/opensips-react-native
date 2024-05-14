"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "ReactSipContext", {
  enumerable: true,
  get: function () {
    return _context.ReactSipContext;
  }
});
Object.defineProperty(exports, "ReactSipProvider", {
  enumerable: true,
  get: function () {
    return _context.ReactSipProvider;
  }
});
exports.redeclareGlobals = void 0;
var _reactNativeWebrtc = require("react-native-webrtc");
var _AudioContext = require("./AudioContext");
var _context = require("./context");
const redeclareGlobals = () => {
  //@ts-ignore
  global.AudioContext = _AudioContext.AudioContext;
  (0, _reactNativeWebrtc.registerGlobals)();
};
exports.redeclareGlobals = redeclareGlobals;
//# sourceMappingURL=index.js.map