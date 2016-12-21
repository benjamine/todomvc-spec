// loads babel-polyfill only if it hasn't been loaded yet
if (typeof global !== 'undefined') {
  if (!global._babelPolyfill) {
    require('babel-polyfill');
  }
} else {
  require('babel-polyfill');
}
