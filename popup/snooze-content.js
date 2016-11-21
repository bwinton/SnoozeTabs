/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

document.addEventListener('click', e => {
  if (!e.target.classList.contains('option')) {
    return;
  }
  var choice = e.target.textContent;
  browser.tabs.query({currentWindow: true, active: true}).then(tabs => {
    for (var tab of tabs) {
      browser.runtime.sendMessage({'time': choice, 'url': tab.url});
    }
  });
});