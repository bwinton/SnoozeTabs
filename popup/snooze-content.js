/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

/* globals timeForId:false, moment:false */

'use strict';

function getParentWithClasses(element, classes) {
  while (element && !classes.every(klass => element.classList.contains(klass))) {
    element = element.parentElement;
  }
  return element;
}

function handleOption(e, target) {
  var choice = target.id || '';
  if (choice === 'pick') {
    document.getElementById('calendar').classList.add('active');
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

function makeEntry(item) {
  let entry = document.createElement('li');
  entry.classList.add('entry');
  entry.innerHTML = `<img src="${item.icon || '../icons/nightly.svg'}" class="icon"></div>
    <div class="content">
      <div class="title">${item.title || '&nbsp;'}</div>
      <div class="url">${item.url || '&nbsp;'}</div>
    </div>
    <div class="date">${item.date || 'Later'}<div>`;
  return entry;
}

function handleManage(e, target) {
  let panel = document.getElementById('manage'); 
  panel.classList.add('active');
  browser.storage.local.get().then(items => {
    console.log(items); // eslint-disable-line no-console
    let entries = panel.querySelector('.entries');
    while (entries.childNodes.length) {
      entries.childNodes[0].remove();
    }
    for (let item in items) {
      entries.appendChild(makeEntry(items[item]));
    }
    // browser.storage.local.clear().then(() => {
      // window.close();
    // });
  });
  return;
}

function handleBack(e, target) {
  let panel = getParentWithClasses(target, ['panel']);
  panel.classList.remove('active');
}

document.addEventListener('click', e => {
  let target = getParentWithClasses(e.target, ['option']);
  if (target) {
    return handleOption(e, target);
  }
  target = getParentWithClasses(e.target, ['footer', 'manage']);
  if (target) {
    return handleManage(e, target);
  }
  target = getParentWithClasses(e.target, ['footer', 'back']);
  if (target) {
    return handleBack(e, target);
  }
});

let dates = document.querySelectorAll('li.option > .date');
for (let date of dates) {
  let choice = date.parentNode.id; 
  let [, text] = timeForId(moment(), choice);
  date.textContent = text;
}