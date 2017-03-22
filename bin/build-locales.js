#! /usr/bin/env node

const spawn = require('cross-spawn');

let locales = '*';
if (process.env.NODE_ENV === 'production' &&
    process.env.npm_package_config_productionLocales) {
  locales = process.env.npm_package_config_productionLocales;
}

const result = spawn.sync('pontoon-to-webext', [], {
  stdio: 'inherit',
  env: Object.assign(
    {},
    process.env,
    { SUPPORTED_LOCALES: locales }
  )
});

if (result.error) {
  console.error(result.error); // eslint-disable-line no-console
  process.exit(1);
}
