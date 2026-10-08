/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

import { idForItem, makeLogger, getUrl } from './lib/utils';
const log = makeLogger('BE');

import moment from 'moment';
import { getLocalizedDateTime } from './lib/time-formats';

import { NEXT_BROWSER_LAUNCH, PICK_TIME, times, timeForId } from './lib/times';
import { getAlarms, saveAlarms, removeAlarms,
         getBookmarkFolderUUID, getDontShow, setDontShow } from './lib/storage';
import { createWakeCoordinator, createWakeFailures, nextWakeAlarmTime,
         wakeItem } from './lib/wake';
const WAKE_ALARM_NAME = 'snooze-wake-alarm';
const PERIODIC_ALARM_NAME = 'snooze-periodic-alarm';

let iconData;
let closeData;
let confirmIconData;
let wakeTimerPaused = false;

// Entries that failed to wake, and their backoff.
const wakeFailures = createWakeFailures({ log });

// Serialises wakes. Both alarms and a new window can start one, and the two
// alarms often fire together on resume from suspend.
const handleWake = createWakeCoordinator(doWake, log);

function init() {
  log('init()');
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      setupBookmarksFolder();
    }
  });
  browser.windows.onCreated.addListener(handleWindowCreated);
  browser.alarms.onAlarm.addListener(handleAlarm);
  browser.notifications.onClicked.addListener(handleNotificationClick);
  browser.runtime.onMessage.addListener(handleMessage);
  browser.tabs.onUpdated.addListener(updateButtonForTab);
  browser.tabs.onCreated.addListener(tab => {
    updateButtonForTab(tab.id, {'status': 'loading', url: tab.url});
  });
  browser.tabs.query({}).then(tabs => {
    for (const tab of tabs) {
      updateButtonForTab(tab.id, {'status': 'loading', url: tab.url});
    }
  }).catch(reason => {
    log('init tabs query rejected', reason);
  });

  prefetchIcons();

  scheduleNextBrowserLaunchTabs()
    .then(updateWakeAndBookmarks)
    .then(startPeriodicAlarm)
    .catch(reason => log('init wake update failed', reason));
}

function prefetchIcons() {
  if (!iconData) {
    fetch(browser.runtime.getURL('icons/color_bell_icon.png')).then(response => {
      return response.arrayBuffer();
    }).then(function(response) {
      iconData = 'data:image/png;base64,' + btoa(String.fromCharCode(...new Uint8Array(response)));
    }).catch(reason => {
      log('init get iconData rejected', reason);
    });
  }

  if (!confirmIconData) {
    fetch(browser.runtime.getURL('icons/confirm_bell_icon.svg')).then(response => {
      return response.arrayBuffer();
    }).then(function(response) {
      confirmIconData = 'data:image/svg+xml;base64,' + btoa(String.fromCharCode(...new Uint8Array(response)));
    }).catch(reason => {
      log('init get confirmIconData rejected', reason);
    });
  }

  if (!closeData) {
    fetch(browser.runtime.getURL('icons/stop.svg')).then(response => {
      return response.arrayBuffer();
    }).then(function(response) {
      closeData = 'data:image/svg+xml;base64,' + btoa(String.fromCharCode(...new Uint8Array(response)));
    }).catch(reason => {
      log('init get closeData rejected', reason);
    });
  }
}

function scheduleNextBrowserLaunchTabs() {
  return getAlarms().then(items => {
    const due = Object.entries(items).filter(item => item[1].time === NEXT_BROWSER_LAUNCH);
    const updated = {};
    due.forEach(item => {
      item[1].time = Date.now();
      updated[item[0]] = item[1];
    });
    log('setting next browser launch tabs to now', Object.keys(updated).length);
    return saveAlarms(updated);
  }).catch(reason => log('scheduleNextBrowserLaunchTabs failed', reason));
}

function updateButtonForTab(tabId, changeInfo) {
  if (changeInfo.status !== 'loading' || !changeInfo.url) {
    return;
  }
  browser.tabs.get(tabId).then(tab => {
    const url = changeInfo.url;
    if (!tab.incognito && (url.startsWith('http:') || url.startsWith('https:') ||
        url.startsWith('ftp:') || url.startsWith('app:') ||
        url.startsWith('about:reader?url='))) {
      browser.browserAction.setIcon({path: 'icons/bell_icon.svg', tabId: tabId});
    } else {
      browser.browserAction.setIcon({path: 'icons/disabled_bell_icon.svg', tabId: tabId});
    }
  }).catch(reason => {
    log('update button get rejected', reason);
  });
}

function handleMessage({op, message}) {
  // Log the URL only: the items carry their favicon as a data URL.
  const item = (message && message.updated) || message || {};
  log('backend received', op, item.url);
  if (messageOps[op]) { messageOps[op](message); }
}

const messageOps = {
  schedule: message => {
    return getDontShow().then(dontShow => {
      if (dontShow || message.readerMode) {
        return messageOps.confirm(message);
      }

      browser.tabs.executeScript(message.tabId, {file: './lib/confirm-bar.js'}).then(() => {
        return chrome.tabs.sendMessage(message.tabId, {message, confirmIconData, closeData});
      }).catch(reason => {
        log('schedule inject rejected', reason);
        return messageOps.confirm(message);
      });
    });
  },
  confirm: message => {
    const toSave = {};
    const tabId = message.tabId;
    delete message.tabId;
    toSave[idForItem(message)] = message;
    return browser.tabs.query({}).then(tabs => {
      if (tabs.length <= 1) {
        browser.tabs.create({
          active: true,
          url: 'about:home'
        });
      }
    }).then(() => {
      return saveAlarms(toSave);
    }).then(() => {
      if (tabId) {
        window.setTimeout(() => {
          browser.tabs.remove(tabId);
        }, 500);
      }
    }).then(updateWakeAndBookmarks).catch(reason => {
      log('confirm rejected', reason);
    });
  },
  cancel: message => {
    return removeAlarms(idForItem(message)).then(updateWakeAndBookmarks);
  },
  save: message => {
    const toSave = {};
    toSave[idForItem(message)] = message;
    return saveAlarms(toSave)
      .then(updateWakeAndBookmarks)
      .catch(reason => log('save rejected', reason));
  },
  update: message => {
    const newId = idForItem(message.updated);
    const oldId = idForItem(message.old);
    if (newId === oldId) { return; }

    const toSave = {};
    toSave[newId] = message.updated;
    return saveAlarms(toSave)
      .then(() => removeAlarms(idForItem(message.old)))
      .then(updateWakeAndBookmarks)
      .catch(reason => log('confirm rejected', reason));
  },
  setconfirm: message => {
    setDontShow(message.dontShow);
  }
};

function setupBookmarksFolder() {
  getBookmarkFolderUUID().then(clientUUID => {
    const title = browser.i18n.getMessage('uniqueBookmarkFolderTitle', clientUUID);
    return browser.bookmarks.search({title: title}).then(folders => {
      return Promise.all(folders.map(folder => {
        return browser.bookmarks.update(folder.id, {
          title: `${title} - ${getLocalizedDateTime(moment(), 'date_year')} ${getLocalizedDateTime(moment(), 'confirmation_time')}`
        });
      }));
    });
  }).catch(reason => {
    log('init bookmark folder rename rejected', reason);
  });
}

function syncBookmarks(items) {
  getBookmarkFolderUUID().then(clientUUID => {
    const title = browser.i18n.getMessage('uniqueBookmarkFolderTitle', clientUUID);
    return browser.bookmarks.search({title: title}).then(folders => {
      if (folders.length) {
        return folders[0];
      }
      return browser.bookmarks.create({title: title});
    });
  }).then(snoozeTabsFolder => {
    log('Sync Folder!', snoozeTabsFolder.id);

    return browser.bookmarks.getChildren(snoozeTabsFolder.id).then((bookmarks) => {
      const tabs = [...Object.values(items)];
      const toCreate = tabs.filter((tab) => !bookmarks.find((bookmark) => tab.url === bookmark.url));
      const toRemove = bookmarks.filter((bookmark) => !tabs.find((tab) => bookmark.url === tab.url));

      const operations = toCreate.map(item => {
        log(`Creating ${item.url}.`);
        return browser.bookmarks.create({
          parentId: snoozeTabsFolder.id,
          title: item.title,
          url: item.url
        });
      }).concat(toRemove.map(item => {
        log(`Removing ${item.url}.`);
        return browser.bookmarks.remove(item.id);
      }));
      return Promise.all(operations);
    });
  }).catch(reason => {
    log('syncBookmarks rejected', reason);
  });
}

function updateWakeAndBookmarks() {
  return browser.alarms.clear(WAKE_ALARM_NAME)
    .then(() => getAlarms())
    .then(items => {
      syncBookmarks(items);

      // Don't set a new wake timer if we're paused.
      if (wakeTimerPaused) { return; }

      const nextAlarm = nextWakeAlarmTime(items, Date.now(),
                                          { wakeTimeFor: wakeFailures.wakeTimeFor });
      if (nextAlarm === null) { return; }

      log('updated wake alarm to', nextAlarm, ' ', getLocalizedDateTime(moment(nextAlarm), 'long_date_time'));
      return browser.alarms.create(WAKE_ALARM_NAME, { when: nextAlarm });
    });
}

function startPeriodicAlarm() {
  log('starting periodic alarm');
  return browser.alarms.create(PERIODIC_ALARM_NAME, { periodInMinutes: 1 });
}

function handleWindowCreated(window) {
  if (wakeTimerPaused && !window.incognito) {
    // Just opened a public window, so let's restart the wake timer
    log('public window opened, resuming wake timer');
    handleWake();
  }
}

function handleAlarm(alarm) {
  const name = alarm && alarm.name;
  if (name !== WAKE_ALARM_NAME && name !== PERIODIC_ALARM_NAME) {
    log('ignoring unknown alarm', name);
    return;
  }
  // The periodic alarm backs up a lost or slept-through wake alarm.
  log('alarm fired', name);
  return handleWake();
}

async function doWake() {
  const now = Date.now();
  log('woke at', now);

  const [items, windows] = await Promise.all([
    getAlarms(),
    browser.windows.getAll({windowTypes: ['normal']})
  ]);
  wakeFailures.forgetMissing(items);

  const publicWindowIds = windows
    .filter(window => !window.incognito)
    .map(window => window.id)
    .sort((a, b) => a - b);

  if (publicWindowIds.length === 0) {
    // Nowhere to open tabs; wait for a public window.
    log('no public windows, pausing wake timer');
    wakeTimerPaused = true;
  } else {
    // handleWindowCreated relies on this to end the pause.
    wakeTimerPaused = false;

    const due = Object.entries(items)
      .filter(([id, item]) => wakeFailures.wakeTimeFor(id, item) <= now);
    log('tabs due to wake', due.length);

    if (due.length) {
      const currentWindow = await currentPublicWindow(publicWindowIds);
      await Promise.all(due.map(([id, item]) => wakeItem({
        id,
        item,
        failures: wakeFailures,
        createTab: () => createTabFor(item, publicWindowIds, currentWindow),
        removeEntry: removeAlarms,
        announce: announceWokenTab,
        log
      })));
    }
  }

  // Await so the reschedule sees the removals above.
  await updateWakeAndBookmarks();
}

// Call only once a public window exists: getCurrent() can reject otherwise.
function currentPublicWindow(publicWindowIds) {
  return browser.windows.getCurrent().then(current => {
    return current.incognito ? publicWindowIds[0] : current.id;
  }).catch(reason => {
    log('windows.getCurrent rejected, using the first public window', reason);
    return publicWindowIds[0];
  });
}

function createTabFor(item, publicWindowIds, currentWindow) {
  log('creating', item.url);
  return browser.tabs.create({
    active: false,
    url: item.url,
    openInReaderMode: item.readerMode,
    windowId: publicWindowIds.includes(item.windowId) ? item.windowId : currentWindow
  });
}

// Cosmetic: runs after the entry is removed, isn't awaited and never rejects.
function announceWokenTab(item, tab) {
  flashFavicon(tab);
  browser.notifications.create(`${item.windowId}:${tab.id}`, {
    'type': 'basic',
    'iconUrl': browser.runtime.getURL('icons/color_bell_icon.png'),
    'title': item.title,
    'message': item.url
  }).catch(reason => {
    log('wake notification rejected', item.url, reason);
  });
}

function flashFavicon(tab) {
  return browser.tabs.executeScript(tab.id, {
    'code': `
      function flip(newUrl) {
        let link = document.createElement('link');
        link.rel = 'shortcut icon';
        link.href = newUrl;
        document.getElementsByTagName('head')[0].appendChild(link);
        return link;
      }

      function reset(link) {
        link.remove();
        let prev = document.querySelectorAll('link[rel="shortcut icon"]');
        if (prev.length) {
          document.getElementsByTagName('head')[0].appendChild(prev.item(prev.length - 1));
        }
      }

      let link;
      let flip_interval = window.setInterval(() => {
        if (link) {
          reset(link);
          link = undefined;
        } else {
          link = flip('${iconData}');
        }
      }, 500);
      window.setTimeout(() => {
        window.clearInterval(flip_interval);
        if (link) {
          reset(link);
          link = undefined;
        }
      }, 10000)
      `
  }).catch(reason => {
    // Routinely fails while the tab is still loading. Only cosmetic.
    log('flashFavicon rejected', tab.id, reason);
  });
}

function handleNotificationClick(notificationId) {
  const [windowId, tabId] = notificationId.split(':');
  browser.windows.update(+windowId, {focused: true});
  browser.tabs.update(+tabId, {active: true});
}

let parent;

if (browser.contextMenus.ContextType.TAB) {
  const title = browser.i18n.getMessage('contextMenuTitle');
    parent = chrome.contextMenus.create({
    contexts: [browser.contextMenus.ContextType.TAB],
    title: title,
    documentUrlPatterns: ['<all_urls>']
  });
  for (const item in times) {
    const time = times[item];
    if (time.id === PICK_TIME) {
      continue;
    }
    chrome.contextMenus.create({
      parentId: parent,
      id: time.id,
      contexts: [browser.contextMenus.ContextType.TAB],
      title: time.title,
    });
  }

  browser.contextMenus.onClicked.addListener(function(info, tab) {
    if (tab.incognito ||
        !tab.url.startsWith('http:') && !tab.url.startsWith('https:') &&
        !tab.url.startsWith('ftp:') && !tab.url.startsWith('app:') &&
        !tab.url.startsWith('about:reader?url=')) {
      return; // Canʼt snooze private or about: or file: tabs
    }
    const title = browser.i18n.getMessage('notificationTitle');
    const [time, ] = timeForId(moment(), info.menuItemId);
    handleMessage({
      'op': tab.active ? 'schedule' : 'confirm',
      'message': {
        'time': time.valueOf(),
        'timeType': info.menuItemId,
        'title': tab.title || title,
        'url': getUrl(tab),
        'tabId': tab.id,
        'windowId': tab.windowId,
        'icon': tab.favIconUrl,
        'readerMode': tab.isInReaderMode
      }
    });
  });
}

init();
