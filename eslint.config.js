const js = require('@eslint/js');
const globals = require('globals');
const react = require('eslint-plugin-react');
const promise = require('eslint-plugin-promise');

// Held at ESLint 9: eslint-plugin-react still peers on ^9.7, so ESLint 10 fails
// to install without legacy-peer-deps.
module.exports = [
  { ignores: ['dist/**', 'data/**', 'lib/moment.js'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.webextensions
      }
    },
    plugins: { promise },
    settings: { react: { version: '15.4' } },
    rules: {
      'constructor-super': 'warn',
      'eqeqeq': 'error',
      'no-const-assign': 'warn',
      'no-this-before-super': 'warn',
      'no-undef': 'warn',
      'no-unreachable': 'warn',
      'no-unused-vars': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'valid-typeof': 'warn',
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      'promise/avoid-new': 'warn',
      'promise/catch-or-return': 'error',
      'promise/no-callback-in-promise': 'warn',
      'promise/no-promise-in-callback': 'warn',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error'
    }
  },
  {
    // src/ ships to users; the one deliberate logger opts out in place.
    files: ['src/**/*.js'],
    rules: { 'no-console': 'error' }
  },
  {
    files: ['test/**/*.js'],
    languageOptions: { globals: { ...globals.mocha } },
    rules: {
      'promise/avoid-new': 'off',
      'promise/no-callback-in-promise': 'off'
    }
  }
];
