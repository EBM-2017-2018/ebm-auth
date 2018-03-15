module.exports = {
  entry: './browser.js',
  mode: 'production',
  output: {
    filename: 'browser.js',
    library: 'browser',
    libraryTarget: 'umd',
    umdNamedDefine: true
  }
};
