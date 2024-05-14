"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _reactSipAPI = require("./reactSipAPI");
Object.keys(_reactSipAPI).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _reactSipAPI[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _reactSipAPI[key];
    }
  });
});
//# sourceMappingURL=index.d.js.map