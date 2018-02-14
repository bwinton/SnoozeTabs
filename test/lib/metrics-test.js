const packageMeta = require('../../package.json');

import { expect } from 'chai';
import sinon from 'sinon';

import { PICK_TIME } from '../../src/lib/times';
import Metrics from '../../src/lib/metrics';

const ONE_SECOND_IN_MS = 1000;
const ONE_DAY_IN_SECONDS = 86400;
const GA_URL = 'https://ssl.google-analytics.com/collect';

describe('lib/metrics', () => {
  let item;

  beforeEach(() => {
    item = {
      time: Date.now() + (ONE_DAY_IN_SECONDS * ONE_SECOND_IN_MS),
      timeType: PICK_TIME,
      url: 'https://example.com/bar'
    };

    global.browser = {
      tabs: {
        onActivated: { addListener: sinon.spy() },
        onRemoved: { addListener: sinon.spy() }
      }
    };

    global.navigator = {
      sendBeacon: sinon.spy()
    };

    Metrics.init('123-456-7890');
  });

  function decodeEvent(encoded) {
    const decoded = {};
    encoded.split('&').forEach(pair => {
      const [key, value] = pair.split('=').map(decodeURIComponent);
      decoded[key] = value;
    });
    return decoded;
  }

  const assertTabMessagePosted = (event, item) => {
    const sendBeacon = global.navigator.sendBeacon;
    expect(sendBeacon.called).to.be.true;

    const lastCall = sendBeacon.lastCall;
    expect(lastCall.args[0]).to.equal(GA_URL);

    const decoded = decodeEvent(lastCall.args[1]);
    expect(decoded).to.deep.include({
      an: packageMeta.id,
      av: packageMeta.version,
      tid: packageMeta.config.GA_TRACKING_ID,
      t: 'event',
      ec: 'interactions',
      ea: event,
      cd2: item.timeType,
      cm1: '' +  ONE_DAY_IN_SECONDS
    });
  };

  it('should initialize successfully', () => {
    expect(global.browser.tabs.onActivated.addListener.called).to.be.true;
    expect(global.browser.tabs.onRemoved.addListener.called).to.be.true;
  });

  it('should measure each time the snooze panel is opened', () => {
    Metrics.panelOpened();
    const msg = global.navigator.sendBeacon.lastCall.args[1];
    expect(decodeEvent(msg)).to.deep.include({ ea: 'panel-opened' });
  });

  it('should measure each time a user chooses to snooze', () => {
    Metrics.scheduleSnoozedTab(item);
    assertTabMessagePosted('snoozed', item);
  });

  it('should measure snooze cancellations', () => {
    Metrics.cancelSnoozedTab(item);
    assertTabMessagePosted('cancelled', item);
  });

  it('should measure snooze updates', () => {
    Metrics.updateSnoozedTab(item);
    assertTabMessagePosted('updated', item);
  });

  it('should measure clicks on currently snoozed tabs', () => {
    Metrics.clickSnoozedTab(item);
    assertTabMessagePosted('clicked', item);
  });

  it('should measure the rate at which snooze tabs wake up', () => {
    const tab = {
      id: 123,
      url: item.url
    };
    Metrics.tabWoken(item, tab);
    assertTabMessagePosted('woken', item);
  });

  it('should measure if users focus previously snoozed tabs', () => {
    const tab = {
      id: 123,
      url: item.url
    };
    Metrics.tabWoken(item, tab);
    expect(global.navigator.sendBeacon.callCount).to.equal(1);

    const handleTabActivated = global.browser.tabs.onActivated.addListener.lastCall.args[0];

    // Unrecognized tab ID shouldn't fire a new metrics event.
    handleTabActivated({ tabId: 456, windowId: 454 });
    expect(global.navigator.sendBeacon.callCount).to.equal(1);

    // But, the ID of a previously woken tab should fire a new event!
    handleTabActivated({ tabId: tab.id, windowId: 234 });
    expect(global.navigator.sendBeacon.callCount).to.equal(2);

    assertTabMessagePosted('focused', item);
  });

  it('should measure if users close a previously snoozed tab without refocusing', () => {
    const tab = {
      id: 123,
      url: item.url
    };
    Metrics.tabWoken(item, tab);
    expect(global.navigator.sendBeacon.callCount).to.equal(1);

    const handleTabRemoved = global.browser.tabs.onRemoved.addListener.lastCall.args[0];

    // Unrecognized tab ID shouldn't fire a new metrics event.
    handleTabRemoved(456);
    expect(global.navigator.sendBeacon.callCount).to.equal(1);

    // But, the ID of a previously woken tab should fire a new event!
    handleTabRemoved(tab.id);
    expect(global.navigator.sendBeacon.callCount).to.equal(2);

    assertTabMessagePosted('closed-unfocused', item);
  });

  it('should measure if users re-snooze a tab', () => {
    const tab = {
      id: 123,
      url: item.url
    };
    item.tabId = tab.id;

    Metrics.tabWoken(item, tab);
    expect(global.navigator.sendBeacon.callCount).to.equal(1);

    Metrics.scheduleSnoozedTab(item);
    assertTabMessagePosted('resnoozed', item);
  });
});
