import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

const babelPlugin = babel({
  exclude: ['node_modules/**']
})

export default [
  // Browser-friendly UMD build
  {
    input: 'browser.js',
    output: {
      file: pkg.browser,
      format: 'umd',
      name: 'ebm-auth',
    },
    plugins: [
      resolve(), // so rollup can find qs
      commonjs(), // so rollup can convert qs to an ES module
      babelPlugin
    ]
  },

  // ES module build (for bundlers)
  {
    input: 'browser.js',
    output: {
      file: pkg.module,
      format: 'es'
    },
    external: ['qs'],
    plugins: [babelPlugin]
  },

  // CommonJS build (for node)
  {
    input: 'express.js',
    output: {
      file: pkg.main,
      format: 'cjs'
    },
    external: ['qs'],
    plugins: [babelPlugin]
  }
];
