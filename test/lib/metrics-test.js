/* global describe, beforeEach, it */

import { expect } from 'chai';
import sinon from 'sinon';

import { PICK_TIME } from '../../src/lib/times';
import Metrics from '../../src/lib/metrics';

function mockBroadcastChannel(onNew) {
  return function(name) {
    this.name = name;
    this.postMessage = sinon.spy();
    onNew(this);
    return this;
  };
}

describe('Metrics', () => {
  let item;
  let channel;
  let browser;

  const BroadcastChannel = mockBroadcastChannel(obj => channel = obj);

  const assertTabMessagePosted = (event, item) => {
    expect(channel.postMessage.called).to.be.true;
    const msg = channel.postMessage.lastCall.args[0];
    expect(msg).to.deep.equal({
      event,
      snooze_time: item.time,
      snooze_time_type: item.timeType
    });
  };

  beforeEach(() => {
    item = {
      time: 8675309,
      timeType: PICK_TIME,
      url: 'https://example.com/bar'
    };
    channel = null;
    browser = {
      tabs: {
        onActivated: { addListener: sinon.spy() },
        onRemoved: { addListener: sinon.spy() }
      }
    };
    Metrics.init(BroadcastChannel, browser.tabs);
  });

  it('should initialize a BroadcastChannel for testpilot-telemetry', () => {
    expect(channel).to.exist;
    expect(channel.name).to.equal('testpilot-telemetry');
    expect(browser.tabs.onActivated.addListener.called).to.be.true;
    expect(browser.tabs.onRemoved.addListener.called).to.be.true;
  });

  it('should measure each time the snooze panel is opened', () => {
    Metrics.panelOpened();
    const msg = channel.postMessage.lastCall.args[0];
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
    expect(channel.postMessage.callCount).to.equal(1);

    const handleTabActivated = browser.tabs.onActivated.addListener.lastCall.args[0];

    // Unrecognized tab ID shouldn't fire a new metrics event.
    handleTabActivated({ tabId: 456, windowId: 454 });
    expect(channel.postMessage.callCount).to.equal(1);

    // But, the ID of a previously woken tab should fire a new event!
    handleTabActivated({ tabId: tab.id, windowId: 234 });
    expect(channel.postMessage.callCount).to.equal(2);

    assertTabMessagePosted('focused', item);
  });

  it('should measure if users close a previously snoozed tab without refocusing', () => {
    const tab = {
      id: 123,
      url: item.url
    };
    Metrics.tabWoken(item, tab);
    expect(channel.postMessage.callCount).to.equal(1);

    const handleTabRemoved = browser.tabs.onRemoved.addListener.lastCall.args[0];

    // Unrecognized tab ID shouldn't fire a new metrics event.
    handleTabRemoved(456);
    expect(channel.postMessage.callCount).to.equal(1);

    // But, the ID of a previously woken tab should fire a new event!
    handleTabRemoved(tab.id);
    expect(channel.postMessage.callCount).to.equal(2);

    assertTabMessagePosted('closed-unfocused', item);
  });

  it('should measure if users re-snooze a tab', () => {
    const tab = {
      id: 123,
      url: item.url
    };
    item.tabId = tab.id;

    Metrics.tabWoken(item, tab);
    expect(channel.postMessage.callCount).to.equal(1);

    Metrics.scheduleSnoozedTab(item);
    assertTabMessagePosted('resnoozed', item);
  });
});
