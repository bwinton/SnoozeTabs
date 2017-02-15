/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import { getAlarmsAndProperties } from '../lib/storage';
import SnoozePopup from '../lib/components/SnoozePopup';
import { makeLogger } from '../lib/utils';

const log = makeLogger('FE');

import moment from 'moment';
import 'moment/min/locales.min';
moment.locale(browser.i18n.getUILanguage());

// HACK: Arbitrary breakpoint for styles below which to use "narrow" variant
// The panel width is specified in Firefox in em units, so it can vary between
// platforms. OS X is around 224px, Windows is around 248px.
const NARROW_PANEL_MIN_WIDTH = 275;

let state = {
  activePanel: 'main',
  tabIsSnoozable: true,
  narrowPopup: false,
  dontShow: false,
  entries: []
};

function setState(data) {
  state = {...state, ...data};
  render();
}

function scheduleSnoozedTab(time, timeType) {
  browser.tabs.query({currentWindow: true, active: true}).then(tabs => {
    for (const tab of tabs) {
      if (tab.incognito) {
        continue;
      }
      const title = browser.i18n.getMessage('notificationTitle');
      browser.runtime.sendMessage({
        op: 'schedule',
        message: {
          'time': time.valueOf(),
          'timeType': timeType,
          'title': tab.title || title,
          'url': tab.url,
          'tabId': tab.id,
          'windowId': tab.windowId,
          'icon': tab.favIconUrl
        }
      });
    }
    window.setTimeout(() => {
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

function updateDontShow(dontShow) {
  browser.runtime.sendMessage({
    'op': 'setconfirm',
    'message': {dontShow: dontShow}
  });
}

function render() {
  ReactDOM.render(
    <SnoozePopup {...state}
                 switchPanel={switchPanel}
                 scheduleSnoozedTab={scheduleSnoozedTab}
                 openSnoozedTab={openSnoozedTab}
                 cancelSnoozedTab={cancelSnoozedTab}
                 updateSnoozedTab={updateSnoozedTab}
                 updateDontShow={updateDontShow}
                 moment={moment} />,
    document.getElementById('app'));
}

function switchPanel(name) {
  setState({ activePanel: name });
}

function fetchEntries() {
  log('fetching items');
  getAlarmsAndProperties().then(data => {
    const dontShow = data.dontShow;
    const items = data.alarms;
    log('fetched items', dontShow, items);
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
        activePanel: activePanel,
        dontShow: dontShow
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
