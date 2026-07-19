// Stub for `react-zlib-js` (the PNG_ZLIB default import in bwip-js's RN build).
//
// The published `react-zlib-js` crashes during its own module evaluation under
// React Native ("Cannot read property 'slice' of null"), so we alias it here
// instead of installing it (see metro.config.js). bwip-js only touches this
// zlib object inside its PNG encoder (toDataURL); DataMatrix only calls toSVG,
// which never runs that path, so an empty object is safe. (The separate Buffer
// import IS used at module eval to decode the built-in font — that one is
// aliased to the real `buffer` polyfill, see react-zlib-js-buffer-shim.js.)
module.exports = {};
