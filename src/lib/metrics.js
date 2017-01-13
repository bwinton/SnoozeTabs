// Track recent tabs woken to see whether they're later closed or focused
let unseenWakeHistory = {};
let seenWakeHistory = {};

// BroadcastChannel for sending metrics pings to Test Pilot add-on
let pingChannel = null;

// Name of the metrics BroadcastChannel expected by the Test Pilot add-on
const TESTPILOT_TELEMETRY_CHANNEL = 'testpilot-telemetry';

const DEBUG = (process.env.NODE_ENV === 'development');

function log(...args) {
  if (DEBUG) { console.log('SnoozeTabs (Metrics):', ...args); }  // eslint-disable-line no-console
}

export default {
  init(BroadcastChannel, tabs) {
    unseenWakeHistory = {};
    seenWakeHistory = {};
    pingChannel = new BroadcastChannel(TESTPILOT_TELEMETRY_CHANNEL);
    tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
    log('init()');
  },

  postMessage(message) {
    log('postMessage', message);
    return (!pingChannel) ? null : pingChannel.postMessage(message);
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
    this.postMessage({ event: 'panel-opened' });
  },

  _commonTabPostMessage(event, item) {
    this.postMessage({
      event,
      snooze_time: item.time,
      snooze_time_type: item.timeType
    });
  },

  clickSnoozedTab(item) {
    this._commonTabPostMessage('clicked', item);
  },

  cancelSnoozedTab(item) {
    this._commonTabPostMessage('cancelled', item);
  },

  scheduleSnoozedTab(item) {
    const tabId = item.tabId;
    if (tabId in seenWakeHistory || tabId in unseenWakeHistory) {
      delete seenWakeHistory[tabId];
      delete unseenWakeHistory[tabId];
      this._commonTabPostMessage('resnoozed', item);
    } else {
      this._commonTabPostMessage('snoozed', item);
    }
  },

  updateSnoozedTab(item) {
    this._commonTabPostMessage('updated', item);
  },

  tabWoken(item, tab) {
    unseenWakeHistory[tab.id] = item;
    this._commonTabPostMessage('woken', item);
  },

  wokenTabFocused(item) {
    this._commonTabPostMessage('focused', item);
  },

  wokenTabClosed(item) {
    this._commonTabPostMessage('closed-unfocused', item);
  }
};
