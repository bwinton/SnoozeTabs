/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

/* globals timeForId:false, moment:false */

'use strict';

function getParentWithClass(element, klass) {
  while (element && !element.classList.contains(klass)) {
    element = element.parentElement;
  }
  return element;
}

document.addEventListener('click', e => {
  let target = getParentWithClass(e.target, 'option');
  if (target) {
    var choice = target.id || '';
    if (choice === 'pick') {
      document.getElementById('calendar').classList.add('active');
      window.setTimeout(() => {
        document.getElementById('calendar').classList.remove('active');
      }, 5000);
      return;
    }
    let [time, ] = timeForId(moment(), choice);
    browser.tabs.query({currentWindow: true}).then(tabs => {
      let addBlank = true;
      let closers = [];
      for (var tab of tabs) {
        if (!tab.active) {
          addBlank = false;
          continue;
        }
        browser.runtime.sendMessage({
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
    return;
  }
  target = getParentWithClass(e.target, 'footer');
  if (target) {
    document.getElementById('manage').classList.add('active');
    browser.storage.local.get().then(items => {
      console.log(items); // eslint-disable-line no-console
      browser.storage.local.clear().then(() => {
        // window.close();
        window.setTimeout(() => {
          document.getElementById('calendar').classList.add('active');
          window.setTimeout(() => {
            document.getElementById('calendar').classList.remove('active');
            document.getElementById('manage').classList.remove('active');
          }, 5000);
        }, 5000);
      });
    });
    return;
  }
});

let dates = document.querySelectorAll('li.option > .date');
for (let date of dates) {
  let choice = date.parentNode.id; 
  let [, text] = timeForId(moment(), choice);
  date.textContent = text;
}