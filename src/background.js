/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

import moment from 'moment';
import { NEXT_OPEN, times, timeForId } from './lib/times';

const DEBUG = (process.env.NODE_ENV === 'development');
const WAKE_ALARM_NAME = 'snooze-wake-alarm';

function log(...args) {
  if (DEBUG) { console.log('SnoozeTabs (BE):', ...args); }  // eslint-disable-line no-console
}

function init() {
  log('init()');
  browser.alarms.onAlarm.addListener(handleWake);
  browser.notifications.onClicked.addListener(handleNotificationClick);
  browser.runtime.onMessage.addListener(handleMessage);
  browser.storage.local.get().then(items => {
    const due = Object.entries(items).filter(item => item[1].time === NEXT_OPEN);
    let updated = {}
    due.forEach(item => {
      item[1].time = Date.now();
      updated[item[0]] = item[1];
    });
    log('setting next open tabs to now', updated);
    browser.storage.local.set(updated).then(() => {
      updateWakeAlarm();
    });
  });
}

function handleMessage({op, message}) {
  log('backend received', op, message);
  if (messageOps[op]) { messageOps[op](message); }
}

const idForItem = item => `${item.time}-${item.url}`;

const messageOps = {
  schedule: message => {
    const toSave = {};
    toSave[idForItem(message)] = message;
    return browser.storage.local.set(toSave).then(updateWakeAlarm);
  },
  cancel: message =>
    browser.storage.local.remove(idForItem(message)).then(updateWakeAlarm),
  update: message =>
    messageOps.cancel(message.old).then(() => messageOps.schedule(message.updated))
};

function updateWakeAlarm() {
  return browser.alarms.clearAll()
    .then(() => browser.storage.local.get())
    .then(items => {
      const times = Object.values(items).map(item => item.time).filter(time => time !== NEXT_OPEN);
      if (!times.length) { return; }

      times.sort();
      const nextTime = times[0];

      const soon = Date.now() + 5000;
      const nextAlarm = Math.max(nextTime, soon);

      log('updated wake alarm to', nextAlarm, ' ', moment(nextAlarm).format());
      return browser.alarms.create(WAKE_ALARM_NAME, { when: nextAlarm });
    });
}

function handleWake() {
  const now = Date.now();
  log('woke at', now);
  return browser.storage.local.get().then(items => {
    const due = Object.entries(items).filter(entry => entry[1].time <= now);
    log('tabs due to wake', due.length);
    return browser.windows.getAll({
      windowTypes: ['normal']
    }).then(windows => {
      let windowIds = windows.map(window => window.id);
      return Promise.all(due.map(([, item]) => {
        let createProps = {
          active: false,
          url: item.url,
          windowId: windowIds.includes(item.windowId) ? item.windowId : undefined
        };
        return browser.tabs.create(createProps).then(tab => {
          return browser.notifications.create(`${item.windowId}:${tab.id}`, {
            'type': 'basic',
            'iconUrl': browser.extension.getURL('link.png'),
            'title': item.title,
            'message': item.url
          });
        })
      })).then(() => {
        browser.storage.local.remove(due.map(entry => entry[0]));
      });
    });
  }).then(updateWakeAlarm);
}

function handleNotificationClick(notificationId) {
  let [windowId, tabId] = notificationId.split(':');
  browser.windows.update(+windowId, {focused: true});
  browser.tabs.update(+tabId, {active: true});
}

if (browser.contextMenus.ContextType.TAB) {
  let parent = chrome.contextMenus.create({
    contexts: [browser.contextMenus.ContextType.TAB],
    title: 'Snooze Tab until…'
  });
  for (let item in times) {
    let time = times[item];
    chrome.contextMenus.create({
      parentId: parent,
      id: time.id,
      contexts: [browser.contextMenus.ContextType.TAB],
      title: time.title,
    });
  }

  browser.contextMenus.onClicked.addListener(function(info/*, tab*/) {
    let [time, ] = timeForId(moment(), info.menuItemId);
    browser.tabs.query({currentWindow: true}).then(tabs => {
      let addBlank = true;
      let closers = [];
      for (var tab of tabs) {
        if (!tab.active) {
          addBlank = false;
          continue;
        }
        handleMessage({
          'op': 'schedule',
          'message': {
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
  });
}

init();
