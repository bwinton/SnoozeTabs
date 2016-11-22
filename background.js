/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

browser.runtime.onMessage.addListener(message => {
  console.log('background', message); // eslint-disable-line no-console
  let item = {};
  item[`${message.time}`] = message;
  browser.storage.local.set(item);
  browser.alarms.create(`${message.time}`, {when: message.time});
});

browser.alarms.onAlarm.addListener(alarm => {
  console.log(alarm); // eslint-disable-line no-console
  browser.storage.local.get(alarm.name).then(messages => {
    let message = messages[alarm.name]
    browser.notifications.create({
      'type': 'basic',
      'iconUrl': browser.extension.getURL('link.png'),
      'title': message.title,
      'message': message.url,
      'contextMessage': 'Ya maroon!'
    });
  });
});