/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

browser.runtime.onMessage.addListener(message => {
  let item = {};
  item[`${message.time}`] = message;
  browser.storage.local.set(item);
  browser.alarms.create(`${message.time}`, {when: message.time});
});

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