/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import SnoozePopup from '../lib/components/SnoozePopup';

// HACK: Arbitrary value found by measuring menu panel popup width
const NARROW_PANEL_MIN_WIDTH = 225;

const DEBUG = (process.env.NODE_ENV === 'development');

let state = {
  activePanel: 'main',
  tabIsSnoozable: true,
  narrowPopup: false,
  entries: []
};

function setState(data) {
  state = {...state, ...data};
  render();
}

function log(...args) {
  if (DEBUG) { console.log('SnoozeTabs (FE):', ...args); }  // eslint-disable-line no-console
}

function scheduleSnoozedTab(time, timeType) {
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
          'timeType': timeType,
          'title': tab.title || 'Tab woke up…',
          'url': tab.url,
          'tabId': tab.id,
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
  browser.runtime.sendMessage({
    op: 'click',
    message: item
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

// Resize handler that lets us switch styles & rendering when the popup is
// summoned from the toolbar versus from the menu panel. Toolbar size is based
// on content size, menu panel body size is forcibly fixed.
function setupResizeHandler() {
  const handler = () => {
    const clientWidth = document.body.clientWidth;
    if (clientWidth === 0) { return; }

    const newNarrowPopup = (clientWidth < NARROW_PANEL_MIN_WIDTH);
    log('resize', clientWidth, state.narrowPopup, newNarrowPopup);

    if (newNarrowPopup !== state.narrowPopup) {
      setState({ narrowPopup: newNarrowPopup });
    }
  };
  handler();
  window.addEventListener('resize', handler);
}

function init() {
  log('init');
  setupResizeHandler();
  render();
  browser.storage.onChanged.addListener((changes, area) => {
    // TODO: granularly apply the changes, rather than triggering a refresh?
    if (area === 'local') { fetchEntries(); }
  });
  fetchEntries();
  browser.runtime.sendMessage({ op: 'panelOpened' });
}

init();
