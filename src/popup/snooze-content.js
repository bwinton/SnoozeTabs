/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import SnoozePopup from '../lib/components/SnoozePopup';

const DEBUG = (process.env.NODE_ENV === 'development');

let state = {
  activePanel: 'main',
  entries: [
    { title: 'foo', url: 'http://qz.com', date: Date.now() }
  ]
};

function setState(data) {
  state = {...state, ...data};
  render();
}

function log(...args) {
  if (DEBUG) { console.log('SnoozeTabs (FE):', ...args); }  // eslint-disable-line no-console
}

function scheduleSnoozedTab(time) {
  browser.tabs.query({currentWindow: true}).then(tabs => {
    let addBlank = true;
    let closers = [];
    for (var tab of tabs) {
      if (!tab.active) {
        addBlank = false;
        continue;
      }
      browser.runtime.sendMessage({
        op: 'schedule',
        message: {
          'time': time.valueOf(),
          'title': tab.title || 'Tab woke up…',
          'url': tab.url,
          'windowId': tab.windowId
        }
      });
      closers.push(tab.id);
    }
    if (addBlank) {
      browser.tabs.create({
        active: true,
        url: 'about:home'
      });
    }
    window.setTimeout(() => {
      browser.tabs.remove(closers);
      window.close();
    }, 500);
  });
  return;
}

function openSnoozedTab(item) {
  browser.tabs.create({
    active: true,
    url: item.url
  });
}

function cancelSnoozedTab(item) {
  browser.runtime.sendMessage({
    op: 'cancel',
    message: item
  });
}

function updateSnoozedTab(item, updatedItem) {
  browser.runtime.sendMessage({
    op: 'update',
    message: { old: item, updated: updatedItem }
  });
}

function render() {
  ReactDOM.render(
    <SnoozePopup {...state}
                 switchPanel={switchPanel}
                 scheduleSnoozedTab={scheduleSnoozedTab}
                 openSnoozedTab={openSnoozedTab}
                 cancelSnoozedTab={cancelSnoozedTab}
                 updateSnoozedTab={updateSnoozedTab} />,
    document.getElementById('app'));
}

function switchPanel(name) {
  setState({ activePanel: name });
}

function fetchEntries() {
  log('fetching items');
  browser.storage.local.get().then(items => {
    log('fetched items', items);
    setState({ entries: Object.values(items || {}) });
  });
}

function init() {
  browser.storage.onChanged.addListener((changes, area) => {
    // TODO: granularly apply the changes, rather than triggering a refresh?
    if (area === 'local') { fetchEntries(); }
  });
  fetchEntries();
  render();
}

init();
