import babel from 'rollup-plugin-babel';
import pkg from './package.json';

const babelBrowserPlugin = babel({
  exclude: ['node_modules/**'],
  runtimeHelpers: true
})

const babelNodeConfig = {
  presets: [
    ['env', {
      targets: {
        node: '6.11'
      },
      modules: false
    }]
  ],
  babelrc: false,
  exclude: ['node_modules/**'],
  runtimeHelpers: true
}

const babelNodePlugin = babel(babelNodeConfig)


export default [
  // ES module build (for bundlers)
  {
    input: 'browser.js',
    output: {
      file: pkg.browser,
      format: 'es'
    },
    external: [
      'qs',
      'babel-runtime/regenerator',
      'babel-runtime/helpers/asyncToGenerator',
      'babel-runtime/core-js/object/assign',
      'babel-runtime/core-js/promise'
    ],
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
