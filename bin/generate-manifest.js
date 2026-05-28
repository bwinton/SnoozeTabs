#! /usr/bin/env node

const path = require('path');
const fs = require('fs');
const packageMeta = require('../package.json');

const manifest = Object.assign(
  {
    name: 'SnoozeTabs',
    author: packageMeta.author,
    version: packageMeta.version,
    homepage_url: packageMeta.homepage,
    description: packageMeta.description,
    applications: {
      gecko: {
        id: packageMeta.id,
      },
    },
    manifest_version: 2,
    default_locale: 'en-US',
    icons: {
      '48': 'icons/color_bell_icon.png',
      '96': 'icons/color_bell_icon.png',
    },
    browser_action: {
      default_popup: 'popup/snooze.html',
      default_icon: {
        '48': 'icons/bell_icon.svg',
        '96': 'icons/bell_icon.svg',
      },
    },
    background: {
      scripts: ['background.js'],
    },
    permissions: [
      'alarms',
      'bookmarks',
      'contextMenus',
      'notifications',
      'storage',
      'tabs',
      '<all_urls>',
    ],
  },
  packageMeta.webextensionManifest
);

const outPath = path.join(path.dirname(__dirname), 'dist', 'manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
