// Shim for `react-zlib-js/buffer.js`.
//
// bwip-js's RN build imports this as its `Buffer` and uses it at MODULE-EVAL
// time — it decodes the built-in OCR-A font (a base64 string) via
// `Buffer.from(data, 'base64')` in a top-level `FontLib.loadFont(...)` call. So
// an empty object is not enough (it made bwip-js fall back to `new Buffer(...)`,
// which threw "Object cannot be used as a constructor"). Point it at the real
// `buffer` polyfill's Buffer, which is a constructable class with .from/.alloc.
module.exports = require('buffer').Buffer;
