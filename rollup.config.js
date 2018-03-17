import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import pkg from './package.json';

const babelBrowserPlugin = babel({
  exclude: ['node_modules/**']
})

const babelNodeConfig = {
  presets: [
    ['env', {
      targets: {
        node: '6.11'
      },
      modules: false
    }]
  ]
}

const babelNodePlugin = babel(babelrc({
  addExternalHelpersPlugin: false,
  exclude: ['node_modules/**'],
  config: babelNodeConfig
}))


export default [
  // ES module build (for bundlers)
  {
    input: 'browser.js',
    output: {
      file: pkg.browser,
      format: 'es'
    },
    external: ['qs'],
    plugins: [babelBrowserPlugin]
  },

  // CommonJS build (for node)
  {
    input: 'express.js',
    output: {
      file: pkg.main,
      format: 'cjs'
    },
    external: ['qs'],
    plugins: [babelNodePlugin]
  }
];
