// Shared by webpack (bundles for Firefox) and mocha (@babel/register, node).
//
// Held at Babel 7: Babel 8 defaults @babel/preset-react to the automatic JSX
// runtime, and React 15 ships no react/jsx-runtime. Moving up needs an explicit
// runtime: 'classic' here, so it belongs with a React upgrade rather than here.
module.exports = function(api) {
  // api.env() already keys the config cache on the env name, so no extra
  // api.cache call is needed.
  const test = api.env('test');

  return {
    presets: [
      ['@babel/preset-env', {
        // Keep in step with strict_min_version in bin/generate-manifest.js.
        // An unset target means ES5, whose async functions need a regenerator
        // runtime we do not bundle.
        targets: test ? { node: 'current' } : { firefox: '140' },
        modules: test ? 'commonjs' : false
      }],
      '@babel/preset-react'
    ]
  };
};
