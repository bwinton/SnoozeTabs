/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

import { makeLogger } from './lib/utils';
const log = makeLogger('BE');

import moment from 'moment';
import 'moment/min/locales.min';
browser.i18n.getAcceptLanguages().then(languages => {
  moment.locale(languages);
}).catch(reason => {
  log('getAcceptLanguages rejected', reason);
});

import { NEXT_OPEN, PICK_TIME, times, timeForId } from './lib/times';
import Metrics from './lib/metrics';
import { getAlarms, saveAlarms, removeAlarms,
         getMetricsUUID, getDontShow, setDontShow } from './lib/storage';
const WAKE_ALARM_NAME = 'snooze-wake-alarm';

let iconData;
let closeData;

function updateButtonForTab(tabId, changeInfo) {
  if (changeInfo.status !== 'loading' || !changeInfo.url) {
    return;
  }
  browser.tabs.get(tabId).then(tab => {
    const url = changeInfo.url;
    if (!tab.incognito && (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('file:') ||
        url.startsWith('ftp:') || url.startsWith('app:'))) {
      browser.browserAction.setIcon({path: 'icons/bell_icon.svg', tabId: tabId});
    } else {
      browser.browserAction.setIcon({path: 'icons/disabled_bell_icon.svg', tabId: tabId});
    }
  }).catch(reason => {
    log('update button get rejected', reason);
  });
}

function init() {
  log('init()');
  browser.alarms.onAlarm.addListener(handleWake);
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

  if (!iconData) {
    fetch(browser.extension.getURL('icons/color_bell_icon.png')).then(response => {
      return response.arrayBuffer();
    }).then(function(response) {
      iconData = 'data:image/png;base64,' + btoa(String.fromCharCode(...new Uint8Array(response)));
    }).catch(reason => {
      log('init get iconData rejected', reason);
    });
  }

  if (!closeData) {
    fetch(browser.extension.getURL('icons/stop.svg')).then(response => {
      return response.arrayBuffer();
    }).then(function(response) {
      closeData = 'data:image/svg+xml;base64,' + btoa(String.fromCharCode(...new Uint8Array(response)));
    }).catch(reason => {
      log('init get closeData rejected', reason);
    });
  }

  getMetricsUUID().then(clientUUID => {
    Metrics.init(clientUUID);
    return getAlarms();
  }).then(items => {
    const due = Object.entries(items).filter(item => item[1].time === NEXT_OPEN);
    const updated = {};
    due.forEach(item => {
      item[1].time = Date.now();
      updated[item[0]] = item[1];
    });
    log('setting next open tabs to now', updated);
    return saveAlarms(updated).then(updateWakeAndBookmarks);
  }).catch(reason => {
    log('init storage get rejected', reason);
  });
}

function handleMessage({op, message}) {
  log('backend received', op, message);
  if (messageOps[op]) { messageOps[op](message); }
}

const idForItem = item => `${item.time}-${item.url}`;

const messageOps = {
  schedule: message => {
    return getDontShow().then(dontShow => {
      if (dontShow) {
        return messageOps.confirm(message);
      }

      browser.tabs.executeScript(message.tabId, {file: './lib/confirm-bar.js'}).then(() => {
        return chrome.tabs.sendMessage(message.tabId, {message, iconData, closeData});
      }).catch(reason => {
        log('schedule inject rejected', reason);
      });
    });
  },
  confirm: message => {
    Metrics.scheduleSnoozedTab(message);
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
    Metrics.cancelSnoozedTab(message);
    return removeAlarms(idForItem(message)).then(updateWakeAndBookmarks);
  },
  update: message => {
    Metrics.updateSnoozedTab(message);
    return messageOps.cancel(message.old).then(() => messageOps.schedule(message.updated));
  },
  setconfirm: message => {
    setDontShow(message.dontShow);
  },
  click: message => {
    Metrics.clickSnoozedTab(message);
  },
  panelOpened: () => {
    Metrics.panelOpened();
  }
};

function syncBookmarks(items) {
  const title = browser.i18n.getMessage('bookmarkFolderTitle');
  browser.bookmarks.search({title: title}).then(folders => {
    return Promise.all(folders.map(folder => {
      return browser.bookmarks.removeTree(folder.id);
    }));
  }).then(() => {
    return browser.bookmarks.create({title: title});
  }).then(snoozeTabsFolder => {
    log('Sync Folder!', snoozeTabsFolder, Object.values(items));
    const sortedEntries = [...Object.values(items)];
    sortedEntries.sort((a, b) => {
      if (a.time === NEXT_OPEN) {
        if (b.time === NEXT_OPEN) {
          return -(a.title.localeCompare(b.title));
        } else {
          return 1;
        }
      } else if (b.time === NEXT_OPEN) {
        return -1;
      } else {
        return b.time - a.time;
      }
    });

    return Promise.all(sortedEntries.map(item => {
      return browser.bookmarks.create({
        parentId: snoozeTabsFolder.id,
        title: item.title,
        url: item.url,
        index: 0
      });
    }));
  }).catch(reason => {
    log('syncBookmarks rejected', reason);
  });
}

function updateWakeAndBookmarks() {
  return browser.alarms.clearAll()
    .then(() => getAlarms())
    .then(items => {
      syncBookmarks(items);
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
  return getAlarms().then(items => {
    const due = Object.entries(items).filter(entry => entry[1].time <= now);
    log('tabs due to wake', due.length);
    return browser.windows.getAll({
      windowTypes: ['normal']
    }).then(windows => {
      const windowIds = windows.map(window => window.id);
      return Promise.all(due.map(([, item]) => {
        log('creating', item);
        const createProps = {
          active: false,
          url: item.url,
          windowId: windowIds.includes(item.windowId) ? item.windowId : undefined
        };
        return browser.tabs.create(createProps).then(tab => {
          Metrics.tabWoken(item, tab);
          browser.tabs.executeScript(tab.id, {
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
          });
          return browser.notifications.create(`${item.windowId}:${tab.id}`, {
            'type': 'basic',
            'iconUrl': browser.extension.getURL('link.png'),
            'title': item.title,
            'message': item.url
          });
        });
      })).then(() => {
        removeAlarms(due.map(entry => entry[0]));
      });
    });
  }).then(updateWakeAndBookmarks);
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
    if (tab.incognito) {
      return; // Canʼt snooze private tabs
    }
    const title = browser.i18n.getMessage('notificationTitle');
    const [time, ] = timeForId(moment(), info.menuItemId);
    handleMessage({
      'op': 'schedule',
      'message': {
        'time': time.valueOf(),
        'timeType': info.menuItemId,
        'title': tab.title || title,
        'url': tab.url,
        'tabId': tab.id,
        'windowId': tab.windowId
      }
    });
  });
}

init();
