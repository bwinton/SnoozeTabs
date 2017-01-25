/* global Metrics */

// Use of package.json for configuration
import packageMeta from '../../package.json';

// Track recent tabs woken to see whether they're later closed or focused
let unseenWakeHistory = {};
let seenWakeHistory = {};

// Channel for sending metrics pings to Test Pilot add-on
let testpilotMetrics = null;

const DEBUG = (process.env.NODE_ENV === 'development');
function log(...args) {
  if (DEBUG) { console.log('SnoozeTabs (Metrics):', ...args); }  // eslint-disable-line no-console
}

export default {
  init(tabs) {
    unseenWakeHistory = {};
    seenWakeHistory = {};

    testpilotMetrics = new Metrics({
      id: packageMeta.id,
      version: packageMeta.version,
      tid: packageMeta.config.GA_TRACKING_ID,
      type: 'webextension',
      uid: '123-456-7890' // TODO: Generate & persist a client-unique ID
    });

    tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
    log('init()');
  },

  sendEvent(message) {
    log('sendEvent', message);
    if (testpilotMetrics) {
      testpilotMetrics.sendEvent(message, (input, output) => ({
        ...output,
        ec: 'interactions',
        ea: message.event,
        cd2: message.snooze_time_type,
        cd3: message.snooze_time
      }));
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
