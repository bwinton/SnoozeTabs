#! /usr/bin/env node

const path = require('path');
const fs = require('fs');
const packageMeta = require('../package.json');

const manifest = Object.assign({
  'author': packageMeta.author,
  'version': packageMeta.version,
  'homepage_url': packageMeta.homepage,
  'applications': {
    'gecko': {
      'id': packageMeta.id
    }
  }
}, packageMeta.webextensionManifest);

const outPath = path.join(path.dirname(__dirname), 'dist', 'manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, '  '));
