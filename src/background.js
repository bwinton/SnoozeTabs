/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

import moment from 'moment';
import { times, timeForId } from './lib/times';

browser.runtime.onMessage.addListener(({op, message}) => {
  console.log('backgroundMessage', op, message);
  switch(op) {
    case 'schedule':
      return handleSchedule(message);
    case 'cancel':
      return handleCancel(message);
    case 'update':
      return handleUpdate(message);
  }
});

function handleSchedule(message) {
  let item = {};
  item[`${message.time}`] = message;
  browser.storage.local.set(item);
  browser.alarms.create(`${message.time}`, {when: message.time});
}

function handleCancel(message) {
  const id = `${message.time}`;
  browser.storage.local.remove(id);
  browser.alarms.clear(id);
}

function handleUpdate(message) {
  handleCancel(message.old);
  handleSchedule(message.updated);
}

browser.notifications.onClicked.addListener(notificationId => {
  let [windowId, tabId] = notificationId.split(':');
  browser.windows.update(+windowId, {focused: true});
  browser.tabs.update(+tabId, {active: true});
});

browser.alarms.onAlarm.addListener(alarm => {
  browser.storage.local.get(alarm.name).then(messages => {
    let message = messages[alarm.name]
    browser.tabs.create({
      active: false,
      url: message.url,
      windowId: message.windowId
    }).then(tab => {
      browser.notifications.create(`${message.windowId}:${tab.id}`, {
        'type': 'basic',
        'iconUrl': browser.extension.getURL('link.png'),
        'title': message.title,
        'message': message.url,
        'contextMessage': 'Ya maroon!'
      });
    });
  });
});

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

  browser.contextMenus.onClicked.addListener(function(info, tab) {
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
  });
}
