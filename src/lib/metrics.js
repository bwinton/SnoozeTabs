import { makeLogger } from './utils';

const log = makeLogger('Metrics');

// Use of package.json for configuration
import packageMeta from '../../package.json';

// Track recent tabs woken to see whether they're later closed or focused
let unseenWakeHistory = {};
let seenWakeHistory = {};
let clientUUID = null;
let id = null;
let version = null;
let tid = null;

const GA_URL = 'https://ssl.google-analytics.com/collect';

export default {
  init(uuid) {
    clientUUID = uuid;
    unseenWakeHistory = {};
    seenWakeHistory = {};
    id = packageMeta.id;
    version = packageMeta.version;
    tid = packageMeta.config.GA_TRACKING_ID;

    browser.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    browser.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
    log('init()');
  },

  sendEvent(message) {
    if (!tid || !clientUUID) {
      // Skip sending metric event if we don't have tracking ID and client ID
      return;
    }

    log('sendEvent', clientUUID, message);

    // Assemble event parameters for GA
    const event = {
      v: 1,
      aip: 1, // anonymize user IP addresses
      an: id,
      av: version,
      tid: tid,
      cid: clientUUID,
      t: 'event',
      ec: 'interactions',
      ea: message.event,
      cd2: message.snooze_time_type,
      cm1: message.snooze_time
    };

    // Form-encode the event
    const encoded = Object.entries(event)
      .map(([key, value]) =>
        encodeURIComponent(key) + '=' + encodeURIComponent(value))
      .join('&');

    // Send using background beacon, if available. Otherwise use fetch()
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      navigator.sendBeacon(GA_URL, encoded);
    } else if (typeof fetch !== 'undefined') {
      fetch(GA_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8' },
        body: encoded
      })
      .then(() => log(`Sent GA message via fetch: ${encoded}`))
      .catch((err) => log(`GA sending via fetch failed: ${err}`));
    }
  },

  handleTabActivated(activeInfo) {
    const tabId = activeInfo.tabId;
    if (!(tabId in unseenWakeHistory)) { return; }

    const item = unseenWakeHistory[tabId];
    delete unseenWakeHistory[tabId];
    seenWakeHistory[tabId] = item;

    this.wokenTabFocused(item);
  },

  handleTabRemoved(tabId/*, removeInfo */) {
    if (tabId in seenWakeHistory) {
      delete seenWakeHistory[tabId];
    }

    if (!(tabId in unseenWakeHistory)) { return; }

    const item = unseenWakeHistory[tabId];
    delete unseenWakeHistory[tabId];

    this.wokenTabClosed(item);
  },

  panelOpened() {
    this.sendEvent({ event: 'panel-opened' });
  },

  _commonTabSendEvent(event, item) {
    this.sendEvent({
      event,
      snooze_time_type: item.timeType,
      // Normalize from datestamp to delay in seconds
      snooze_time: Math.ceil((item.time - Date.now()) / 1000)
    });
  },

  clickSnoozedTab(item) {
    this._commonTabSendEvent('clicked', item);
  },

  cancelSnoozedTab(item) {
    this._commonTabSendEvent('cancelled', item);
  },

  scheduleSnoozedTab(item) {
    const tabId = item.tabId;
    if (tabId in seenWakeHistory || tabId in unseenWakeHistory) {
      delete seenWakeHistory[tabId];
      delete unseenWakeHistory[tabId];
      this._commonTabSendEvent('resnoozed', item);
    } else {
      this._commonTabSendEvent('snoozed', item);
    }
  },

  updateSnoozedTab(item) {
    this._commonTabSendEvent('updated', item);
  },

  tabWoken(item, tab) {
    unseenWakeHistory[tab.id] = item;
    this._commonTabSendEvent('woken', item);
  },

  wokenTabFocused(item) {
    this._commonTabSendEvent('focused', item);
  },

  wokenTabClosed(item) {
    this._commonTabSendEvent('closed-unfocused', item);
  }
};
