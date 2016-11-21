/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

document.addEventListener('click', e => {
  if (e.target.classList.contains('option')) {
    var choice = e.target.textContent;
    browser.tabs.query({currentWindow: true, active: true}).then(tabs => {
      for (var tab of tabs) {
        browser.runtime.sendMessage({'choice': choice, 'url': tab.url});
      }
    });
  } else if (e.target.classList.contains('footer')) {
    browser.storage.local.get().then(items => {
      console.log(items);
      browser.storage.local.clear();
    });
  }
});