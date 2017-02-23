const packageMeta = require('../../package.json');

import { expect } from 'chai';
import sinon from 'sinon';

import { PICK_TIME } from '../../src/lib/times';
import Metrics from '../../src/lib/metrics';

const ONE_SECOND_IN_MS = 1000;
const ONE_DAY_IN_SECONDS = 86400;

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

    // HACK: Mock testpilot-metrics as the global var Metrics
    global.Metrics = function (params) {
      expect(params).to.deep.equal({
        id: packageMeta.id,
        version: packageMeta.version,
        tid: packageMeta.config.GA_TRACKING_ID,
        type: 'webextension',
        uid: '123-456-7890'
      });

      global.Metrics.current = this;
      this.sendEvent = sinon.spy();
      return this;
    };
    global.Metrics.current = null;

    Metrics.init('123-456-7890');
  });

  const assertTabMessagePosted = (event, item) => {
    const sendEvent = global.Metrics.current.sendEvent;
    expect(sendEvent.called).to.be.true;

    const lastCall = sendEvent.lastCall;

    const msg = lastCall.args[0];
    expect(msg).to.deep.equal({
      event,
      snooze_time_type: item.timeType,
      snooze_time: ONE_DAY_IN_SECONDS
    });

    const gaTransform = lastCall.args[1];
    expect(gaTransform(msg, {foo: 1})).to.deep.equal({
      foo: 1,
      ec: 'interactions',
      ea: msg.event,
      cd2: msg.snooze_time_type,
      cm1: msg.snooze_time
    });
  };

  it('should initialize successfully', () => {
    expect(global.Metrics.current).to.exist;
    expect(global.browser.tabs.onActivated.addListener.called).to.be.true;
    expect(global.browser.tabs.onRemoved.addListener.called).to.be.true;
  });

  it('should measure each time the snooze panel is opened', () => {
    Metrics.panelOpened();
    const msg = global.Metrics.current.sendEvent.lastCall.args[0];
    expect(msg).to.deep.equal({ event: 'panel-opened' });
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
    expect(global.Metrics.current.sendEvent.callCount).to.equal(1);

    const handleTabActivated = global.browser.tabs.onActivated.addListener.lastCall.args[0];

    // Unrecognized tab ID shouldn't fire a new metrics event.
    handleTabActivated({ tabId: 456, windowId: 454 });
    expect(global.Metrics.current.sendEvent.callCount).to.equal(1);

    // But, the ID of a previously woken tab should fire a new event!
    handleTabActivated({ tabId: tab.id, windowId: 234 });
    expect(global.Metrics.current.sendEvent.callCount).to.equal(2);

    assertTabMessagePosted('focused', item);
  });

  it('should measure if users close a previously snoozed tab without refocusing', () => {
    const tab = {
      id: 123,
      url: item.url
    };
    Metrics.tabWoken(item, tab);
    expect(global.Metrics.current.sendEvent.callCount).to.equal(1);

    const handleTabRemoved = global.browser.tabs.onRemoved.addListener.lastCall.args[0];

    // Unrecognized tab ID shouldn't fire a new metrics event.
    handleTabRemoved(456);
    expect(global.Metrics.current.sendEvent.callCount).to.equal(1);

    // But, the ID of a previously woken tab should fire a new event!
    handleTabRemoved(tab.id);
    expect(global.Metrics.current.sendEvent.callCount).to.equal(2);

    assertTabMessagePosted('closed-unfocused', item);
  });

  it('should measure if users re-snooze a tab', () => {
    const tab = {
      id: 123,
      url: item.url
    };
    item.tabId = tab.id;

    Metrics.tabWoken(item, tab);
    expect(global.Metrics.current.sendEvent.callCount).to.equal(1);

    Metrics.scheduleSnoozedTab(item);
    assertTabMessagePosted('resnoozed', item);
  });
});
