/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

browser.runtime.onMessage.addListener(message => {
  console.log('background', message);
  browser.notifications.create({
    'type': 'basic',
    'iconUrl': browser.extension.getURL('link.png'),
    'title': 'You clicked a link!',
    'message': `${message.time} - ${message.url}`
  });

});