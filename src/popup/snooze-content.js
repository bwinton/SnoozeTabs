/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

import React from 'react';
import ReactDOM from 'react-dom';

import moment from 'moment';

import SnoozePopup from '../lib/components/SnoozePopup';

import { timeForId } from '../lib/times';

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

function switchPanel(name) {
  setState({ activePanel: name });
}

function fetchEntries() {
  browser.storage.local.get().then(items => {
    setState({ entries: Object.values(items || {}) });
  });
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
        'time': time.valueOf(),
        'title': tab.title || 'Tab woke up…',
        'url': tab.url,
        'windowId': tab.windowId
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
}

function cancelSnoozedTab(item) {
}

function updateSnoozedTab(item) {
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

function init() {
  browser.storage.onChanged.addListener((changes, area) => {
    // TODO: granularly apply the changes, rather than triggering a refresh?
    if (area === 'local') { fetchEntries(); }
  });
  fetchEntries();
  render();
}

init();
