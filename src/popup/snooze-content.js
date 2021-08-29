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
log('loaded');

const NARROW_MIN_WIDTH = 320;

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
  browser.runtime.sendMessage({ op: 'save', message: item });
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
          !url.startsWith('http:') && !url.startsWith('https:') &&
          !url.startsWith('ftp:') && !url.startsWith('app:')) {
        tabIsSnoozable = false;
      }
    }
    return tabIsSnoozable;
  });
}

// HACK: debounce resize event handling with a flag & requestAnimationFrame
// https://developer.mozilla.org/en-US/docs/Web/Events/resize
let resizePending = false;
const resizeHandler = () => {
  const width = document.body.clientWidth;

  if (width === 0) {
    log('resize (zero - ignored)', width);
    return;
  }

  if (resizePending) {
    log('resize (ignored)', width);
    return;
  }

  log('resize (pending)', width);
  resizePending = true;

  window.requestAnimationFrame(() => {
    log('resize (handled)', width, width < NARROW_MIN_WIDTH ? 'menu' : 'toolbar');
    document.body.classList[width < NARROW_MIN_WIDTH ? 'add' : 'remove']('narrow');
    resizePending = false;
    window.removeEventListener('resize', resizeHandler);
  });
};

const keyboardHandler = (e) => {
  const selectables = [...document.querySelectorAll('.option')];
  const element = document.activeElement;
  const index = selectables.indexOf(element) || 0;

  switch (e.keyCode) {
  case 40: { // down
    const nextElement = selectables[(index + 1) % selectables.length];
    if (nextElement) {
      nextElement.focus();
    }
    break;
  }
  case 38: { // up
    const previousElement = selectables[(index + selectables.length - 1) % selectables.length];
    if (previousElement) {
      previousElement.focus();
    }
    break;
  }
  case 39: { // enter
    if (element) {
      element.click();
    }
    break;
  }
  default:
    break;
  }
};

function init() {
  log('init');

  if (process.env.NODE_ENV !== 'production') {
    document.body.classList.add('development');
  }

  document.addEventListener('keydown', keyboardHandler);
  window.addEventListener('resize', resizeHandler);

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
