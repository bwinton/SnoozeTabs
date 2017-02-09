import babel from 'rollup-plugin-babel';
import cjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import json from 'rollup-plugin-json';

export default {
  entry: `src/${process.env.entry}.js`,
  dest: `dist/${process.env.entry}.js`,
  format: 'iife',
  plugins: [
    json({
      exclude: 'node_modules/**',
    }),
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [ [ 'es2015', { modules: false } ], 'stage-0', 'react' ],
      plugins: [ 'external-helpers' ]
    }),
    cjs({
      exclude: 'node_modules/process-es6/**',
    }),
    globals(),
    replace({ 'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"` }),
    resolve({
      browser: true,
      main: true
    })
  ],
  sourceMap: false
};
