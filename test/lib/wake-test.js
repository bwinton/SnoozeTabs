import { expect } from 'chai';
import sinon from 'sinon';

import { createWakeCoordinator, createWakeFailures, itemWakeTime,
         nextWakeAlarmTime, wakeItem, MIN_WAKE_DELAY } from '../../src/lib/wake';

function deferred() {
  const box = {};
  box.promise = new Promise((resolve, reject) => {
    box.resolve = resolve;
    box.reject = reject;
  });
  return box;
}

describe('lib/wake', () => {
  describe('itemWakeTime()', () => {
    it('yields the time of a normal entry', () => {
      expect(itemWakeTime({ time: 1234 })).to.equal(1234);
    });

    it('yields Infinity for a next-browser-launch entry', () => {
      // NEXT_BROWSER_LAUNCH stores the string 'next', not a timestamp.
      expect(itemWakeTime({ time: 'next' })).to.equal(Infinity);
    });

    it('yields Infinity for a corrupt time', () => {
      expect(itemWakeTime({ time: NaN })).to.equal(Infinity);
      expect(itemWakeTime({ time: undefined })).to.equal(Infinity);
      expect(itemWakeTime({})).to.equal(Infinity);
    });
  });

  describe('nextWakeAlarmTime()', () => {
    const now = 1000000;

    it('yields null when there is nothing to schedule', () => {
      expect(nextWakeAlarmTime({}, now)).to.equal(null);
    });

    it('yields null when nothing is schedulable', () => {
      const items = { a: { time: 'next' }, b: { time: NaN } };
      expect(nextWakeAlarmTime(items, now)).to.equal(null);
    });

    it('picks the earliest entry numerically, not as a string', () => {
      // The regression: [100, 9].sort() is ['100', '9'], so the old code
      // picked 100 and scheduled the later tab first.
      const items = { a: { time: now + 100 }, b: { time: now + 9 } };
      expect(nextWakeAlarmTime(items, now, { minDelay: 0 }))
        .to.equal(now + 9);
    });

    it('ignores unschedulable entries when picking the earliest', () => {
      const items = {
        a: { time: 'next' },
        b: { time: now + 60000 },
        c: { time: NaN }
      };
      expect(nextWakeAlarmTime(items, now)).to.equal(now + 60000);
    });

    it('floors an imminent wake at minDelay', () => {
      const items = { a: { time: now + 1 } };
      expect(nextWakeAlarmTime(items, now)).to.equal(now + MIN_WAKE_DELAY);
    });

    it('arms a past-due entry at the floor', () => {
      // Entries routinely come due while the browser is closed, and "next
      // browser launch" entries are rewritten to now at startup. Neither has
      // failed yet, so neither may be delayed beyond the floor.
      const items = { a: { time: now - 60000 } };
      expect(nextWakeAlarmTime(items, now)).to.equal(now + MIN_WAKE_DELAY);
    });

    it('leaves a comfortably future wake alone', () => {
      const items = { a: { time: now + 3600000 } };
      expect(nextWakeAlarmTime(items, now)).to.equal(now + 3600000);
    });

    it('keeps the development +5s snooze schedulable', () => {
      // The development build offers a five second snooze, so the floor must
      // not push it out.
      const items = { a: { time: now + 5000 } };
      expect(nextWakeAlarmTime(items, now)).to.equal(now + 5000);
    });

    it('schedules a backed-off entry at its retry time', () => {
      const items = { a: { time: now - 1 }, b: { time: now + 3600000 } };
      const wakeTimeFor = (id, item) => id === 'a' ? now + 20000 : item.time;
      expect(nextWakeAlarmTime(items, now, { wakeTimeFor })).to.equal(now + 20000);
    });
  });

  describe('createWakeFailures()', () => {
    const item = { time: 0, url: 'https://example.com/' };

    function failures(options = {}) {
      return createWakeFailures({
        retryBase: 10, retryMax: 40, now: () => 0, log: sinon.spy(), ...options
      });
    }

    it('backs off failed items exponentially and caps the delay', () => {
      const f = failures();
      f.noteFailure('item', item, new Error('first'));
      expect(f.wakeTimeFor('item', item)).to.equal(10);
      f.noteFailure('item', item, new Error('second'));
      expect(f.wakeTimeFor('item', item)).to.equal(20);
      f.noteFailure('item', item, new Error('third'));
      f.noteFailure('item', item, new Error('fourth'));
      expect(f.wakeTimeFor('item', item)).to.equal(40);
    });

    it('wakes at the later of the entry time and the retry time', () => {
      const f = failures();
      f.noteFailure('item', item, new Error('failed'));
      expect(f.wakeTimeFor('item', { time: 5 })).to.equal(10);
      expect(f.wakeTimeFor('item', { time: 50 })).to.equal(50);
      expect(f.wakeTimeFor('other', { time: 5 })).to.equal(5);
    });

    it('keeps unschedulable entries unschedulable', () => {
      const f = failures();
      f.noteFailure('item', item, new Error('failed'));
      expect(f.wakeTimeFor('item', { time: 'next' })).to.equal(Infinity);
    });

    it('remembers an opened tab across further failures', () => {
      const f = failures();
      expect(f.hasOpened('item')).to.equal(false);
      f.noteFailure('item', item, new Error('removal'), { opened: true });
      expect(f.hasOpened('item')).to.equal(true);
      f.noteFailure('item', item, new Error('removal again'));
      expect(f.hasOpened('item')).to.equal(true);
    });

    it('forgets an entry completely', () => {
      const f = failures();
      f.noteFailure('item', item, new Error('removal'), { opened: true });
      f.forget('item');
      expect(f.hasOpened('item')).to.equal(false);
      expect(f.wakeTimeFor('item', item)).to.equal(0);
    });

    it('forgets entries that are no longer stored', () => {
      const f = failures();
      f.noteFailure('gone', item, new Error('failed'));
      f.noteFailure('kept', item, new Error('failed'));
      f.forgetMissing({ kept: item });
      expect(f.wakeTimeFor('gone', item)).to.equal(0);
      expect(f.wakeTimeFor('kept', item)).to.equal(10);
    });
  });

  describe('createWakeCoordinator()', () => {
    it('runs a single request', () => {
      const doWake = sinon.spy(() => Promise.resolve());
      const requestWake = createWakeCoordinator(doWake, sinon.spy());

      return requestWake().then(() => {
        expect(doWake).to.have.property('callCount', 1);
      });
    });

    it('does not start a second run while one is in flight', () => {
      const pending = deferred();
      const doWake = sinon.spy(() => pending.promise);
      const requestWake = createWakeCoordinator(doWake, sinon.spy());

      const first = requestWake();
      const second = requestWake();
      expect(second).to.equal(first);

      // The run starts on a microtask, so let it get going first.
      return Promise.resolve().then(() => {
        expect(doWake).to.have.property('callCount', 1);
        pending.resolve();
        return first;
      }).then(() => {
        // The request that arrived mid-run got its own run afterwards.
        expect(doWake).to.have.property('callCount', 2);
      });
    });

    it('coalesces many mid-run requests into one follow-up', () => {
      const pending = deferred();
      const doWake = sinon.spy(() => pending.promise);
      const requestWake = createWakeCoordinator(doWake, sinon.spy());

      const first = requestWake();
      requestWake();
      requestWake();
      requestWake();

      return Promise.resolve().then(() => {
        pending.resolve();
        return first;
      }).then(() => {
        expect(doWake).to.have.property('callCount', 2);
      });
    });

    it('releases the guard after a rejected run', () => {
      const log = sinon.spy();
      const doWake = sinon.stub();
      doWake.onFirstCall().returns(Promise.reject(new Error('failed')));
      doWake.onSecondCall().returns(Promise.resolve());
      const requestWake = createWakeCoordinator(doWake, log);

      return requestWake().then(() => requestWake()).then(() => {
        expect(doWake).to.have.property('callCount', 2);
        expect(log).to.have.property('callCount', 1);
      });
    });

    it('releases the guard when doWake throws synchronously', () => {
      // The trap this guards: if the drain settled during requestWake, the
      // guard would be cleared before it was assigned and stay set forever.
      const log = sinon.spy();
      const doWake = sinon.stub();
      doWake.onFirstCall().throws(new Error('sync failure'));
      doWake.onSecondCall().returns(Promise.resolve());
      const requestWake = createWakeCoordinator(doWake, log);

      return requestWake().then(() => requestWake()).then(() => {
        expect(doWake).to.have.property('callCount', 2);
        expect(log).to.have.property('callCount', 1);
      });
    });

    it('does not leave a follow-up queued after a rejected run', () => {
      const first = deferred();
      const doWake = sinon.stub();
      doWake.onFirstCall().returns(first.promise);
      doWake.returns(Promise.resolve());
      const requestWake = createWakeCoordinator(doWake, sinon.spy());

      const run = requestWake();
      requestWake();                 // queues a follow-up

      return Promise.resolve().then(() => {
        first.reject(new Error('failed'));
        return run;
      }).then(() => {
        // The rejection is swallowed, but the queued request still ran, and
        // nothing is left queued behind it.
        expect(doWake).to.have.property('callCount', 2);
        return requestWake();
      }).then(() => {
        expect(doWake).to.have.property('callCount', 3);
      });
    });
  });

  describe('wakeItem()', () => {
    const item = { time: 0, url: 'https://example.com/', windowId: 1 };
    const tab = { id: 9 };

    function wake(overrides = {}) {
      const deps = {
        id: 'item',
        item,
        failures: createWakeFailures({ now: () => 0, log: sinon.spy() }),
        createTab: sinon.spy(() => Promise.resolve(tab)),
        removeEntry: sinon.spy(() => Promise.resolve()),
        announce: sinon.spy(),
        log: sinon.spy(),
        ...overrides
      };
      return { deps, result: wakeItem(deps) };
    }

    it('drops the entry before any presentation work', async () => {
      const removal = deferred();
      const { deps, result } = wake({ removeEntry: sinon.spy(() => removal.promise) });

      // Let createTab resolve and the removal start.
      await new Promise(resolve => setImmediate(resolve));
      expect(deps.removeEntry).to.have.property('callCount', 1);
      expect(deps.announce).to.have.property('callCount', 0);

      removal.resolve();
      await result;
      expect(deps.announce).to.have.property('callCount', 1);
      expect(deps.announce.firstCall.args).to.deep.equal([item, tab]);
    });

    it('backs off a tab creation failure without dropping the entry', () => {
      const { deps, result } = wake({
        createTab: sinon.spy(() => Promise.reject(new Error('blocked')))
      });

      return result.then(() => {
        expect(deps.removeEntry).to.have.property('callCount', 0);
        expect(deps.announce).to.have.property('callCount', 0);
        expect(deps.failures.wakeTimeFor('item', item)).to.be.above(0);
        expect(deps.failures.hasOpened('item')).to.equal(false);
      });
    });

    it('remembers the open tab when only the removal fails', () => {
      const { deps, result } = wake({
        removeEntry: sinon.spy(() => Promise.reject(new Error('storage')))
      });

      return result.then(() => {
        expect(deps.announce).to.have.property('callCount', 0);
        expect(deps.failures.hasOpened('item')).to.equal(true);
      });
    });

    it('only retries the removal once the tab is open', () => {
      const failures = createWakeFailures({ now: () => 0, log: sinon.spy() });
      failures.noteFailure('item', item, new Error('storage'), { opened: true });
      const { deps, result } = wake({ failures });

      return result.then(() => {
        expect(deps.createTab).to.have.property('callCount', 0);
        expect(deps.removeEntry).to.have.property('callCount', 1);
        // Nothing to announce: the tab was opened by the earlier attempt.
        expect(deps.announce).to.have.property('callCount', 0);
        expect(failures.hasOpened('item')).to.equal(false);
        expect(failures.wakeTimeFor('item', item)).to.equal(0);
      });
    });

    it('clears an earlier failure once the wake succeeds', () => {
      const failures = createWakeFailures({ now: () => 0, log: sinon.spy() });
      failures.noteFailure('item', item, new Error('blocked'));
      const { result } = wake({ failures });

      return result.then(() => {
        expect(failures.wakeTimeFor('item', item)).to.equal(0);
      });
    });

    it('logs a throwing announce rather than filing it as a failure', () => {
      const { deps, result } = wake({
        announce: () => { throw new Error('notification'); }
      });

      return result.then(() => {
        expect(deps.log).to.have.property('callCount', 1);
        expect(deps.failures.wakeTimeFor('item', item)).to.equal(0);
      });
    });

    it('never rejects', () => {
      const { result } = wake({
        createTab: sinon.spy(() => Promise.reject(new Error('blocked'))),
        removeEntry: sinon.spy(() => Promise.reject(new Error('storage'))),
        announce: () => { throw new Error('notification'); }
      });

      return result.then(value => {
        expect(value).to.equal(undefined);
      });
    });
  });
});
