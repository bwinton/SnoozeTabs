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
  tabIsSnoozable: true,
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
    const closers = [];
    for (const tab of tabs) {
      if (!tab.active) {
        addBlank = false;
        continue;
      }
      if (tab.incognito) {
        continue;
      }
      browser.runtime.sendMessage({
        op: 'schedule',
        message: {
          'time': time.valueOf(),
          'title': tab.title || 'Tab woke up…',
          'url': tab.url,
          'windowId': tab.windowId,
          'icon': tab.favIconUrl
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
  }).catch(reason => {
    log('scheduleSnoozedTab query rejected', reason);
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
    return browser.tabs.query({currentWindow: true, active: true}).then(tabs => {
      let tabIsSnoozable = true;
      let activePanel = 'main';

      if (tabs.length) {
        const url = tabs[0].url;
        if (tabs[0].incognito ||
            !url.startsWith('http:') && !url.startsWith('https:') && !url.startsWith('file:') &&
            !url.startsWith('ftp:') && !url.startsWith('app:')) {
          tabIsSnoozable = false;
          activePanel = 'manage';
        }
      }
      setState({
        entries: Object.values(items || {}),
        tabIsSnoozable: tabIsSnoozable,
        activePanel: activePanel
      });
    });
  }).catch(reason => {
    log('fetchEntries storage get rejected', reason);
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
