#! /usr/bin/env node
const https = require('https');
const spawn = require('cross-spawn');
const url = 'https://l10n.mozilla-community.org/webstatus/api/?product=testpilot-snoozetabs&json&type=complete';

if (process.env.NODE_ENV === 'production') {
  fetchLocales(conversion);
} else conversion('*');

function conversion(locales) {
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
}

function fetchLocales(cb) {
  return https.get(url, function(res) {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => cb(JSON.parse(body).toString()));
  });
}
