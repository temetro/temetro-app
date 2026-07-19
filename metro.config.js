// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// react-native-svg 15.15.x points its `react-native` field at the uncompiled
// `src/index.ts`, which Metro fails to resolve in this setup (heroui-native pulls
// it in). Pin the bare import to the package's compiled entry instead. Set on the
// base config so Uniwind uses it as the underlying resolver.
const reactNativeSvgEntry = require.resolve('react-native-svg');
// bwip-js's RN build statically imports `react-zlib-js` (+ its buffer.js), which
// crashes at module-eval under React Native. DataMatrix only uses toSVG (no
// zlib/Buffer), so alias both to an empty stub. See metro/react-zlib-js-stub.js.
const zlibStub = require.resolve('./metro/react-zlib-js-stub.js');
const baseResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-svg') {
    return { type: 'sourceFile', filePath: reactNativeSvgEntry };
  }
  if (moduleName === 'react-zlib-js' || moduleName === 'react-zlib-js/buffer.js') {
    return { type: 'sourceFile', filePath: zlibStub };
  }
  return (baseResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

// withUniwindConfig must be the outermost wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './uniwind-types.d.ts',
});
