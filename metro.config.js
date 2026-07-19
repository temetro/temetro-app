// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// react-native-svg 15.15.x points its `react-native` field at the uncompiled
// `src/index.ts`, which Metro fails to resolve in this setup (heroui-native pulls
// it in). Pin the bare import to the package's compiled entry instead. Set on the
// base config so Uniwind uses it as the underlying resolver.
const reactNativeSvgEntry = require.resolve('react-native-svg');
// bwip-js's RN build statically imports `react-zlib-js` (as PNG_ZLIB) and
// `react-zlib-js/buffer.js` (as Buffer); the real package crashes at
// module-eval under React Native. The zlib object is only used by the unused
// PNG path, so it gets an empty stub — but Buffer IS used at eval (to decode the
// built-in OCR-A font), so it must be a real, constructable Buffer.
const zlibStub = require.resolve('./metro/react-zlib-js-stub.js');
const bufferShim = require.resolve('./metro/react-zlib-js-buffer-shim.js');
const baseResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return { type: 'sourceFile', filePath: reactNativeSvgEntry };
  }
  if (moduleName === 'react-zlib-js/buffer.js') {
    return { type: 'sourceFile', filePath: bufferShim };
  }
  if (moduleName === 'react-zlib-js') {
    return { type: 'sourceFile', filePath: zlibStub };
  }
  return (baseResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

// withUniwindConfig must be the outermost wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './uniwind-types.d.ts',
});
