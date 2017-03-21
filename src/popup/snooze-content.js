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

function undeleteSnoozedTab(item) {
  browser.runtime.sendMessage({ op: 'confirm', message: item });
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

function queryTabIsSnoozable() {
  return browser.tabs.query({currentWindow: true, active: true}).then(tabs => {
    let tabIsSnoozable = true;
    if (tabs.length) {
      const url = tabs[0].url;
      if (tabs[0].incognito ||
          !url.startsWith('http:') && !url.startsWith('https:') && !url.startsWith('file:') &&
          !url.startsWith('ftp:') && !url.startsWith('app:')) {
        tabIsSnoozable = false;
      }
    }
    return tabIsSnoozable;
  });
}

function init() {
  log('init');

  ReactDOM.render(
    <SnoozePopup {...{
      queryTabIsSnoozable,
      getAlarmsAndProperties,
      scheduleSnoozedTab,
      undeleteSnoozedTab,
      openSnoozedTab,
      cancelSnoozedTab,
      updateSnoozedTab,
      updateDontShow,
      moment
    }} />,
    document.getElementById('app')
  );

  browser.runtime.sendMessage({ op: 'panelOpened' });
}

init();
