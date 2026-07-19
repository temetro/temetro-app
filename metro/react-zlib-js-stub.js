// Stub for `react-zlib-js`.
//
// bwip-js's React Native build (dist/bwip-js-rn.mjs) statically imports
// `react-zlib-js` (as PNG_ZLIB) and `react-zlib-js/buffer.js` (as Buffer), but
// only ever uses them inside its PNG encoder and image-input paths. Our
// DataMatrix component only calls `toSVG`, which never touches either, so the
// real package is dead weight — and the published `react-zlib-js` crashes
// during its own module evaluation under React Native ("Cannot read property
// 'slice' of null"), which took the whole bundle down.
//
// Metro aliases both `react-zlib-js` and `react-zlib-js/buffer.js` to this empty
// module (see metro.config.js), satisfying the static imports without pulling in
// the broken package. An empty object is safe: the only code that would read
// from it lives in the unused PNG/Buffer paths.
module.exports = {};
