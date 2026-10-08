/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

// Wake logic, kept free of browser.* so it can be unit tested. background.js
// wires it up.

// Earliest the wake alarm is scheduled from now. Must not exceed the
// development build's five-second "Real Soon Now" snooze.
export const MIN_WAKE_DELAY = 5000;

// Backoff for entries that fail to wake: doubles from the base up to the max.
export const WAKE_RETRY_BASE = 10000;
export const WAKE_RETRY_MAX = 60 * 60 * 1000;

// Wake time of an entry, or Infinity if it has none (NEXT_BROWSER_LAUNCH
// stores 'next', or the entry is corrupt). Keeps NaN out of Math.min and
// alarms.create.
export function itemWakeTime(item) {
  return Number.isFinite(item.time) ? item.time : Infinity;
}

// Tracks entries that failed to wake. The due filter and nextWakeAlarmTime
// both use wakeTimeFor(), so a failing entry can't pin the alarm at its floor.
// In memory only: a restart retries every entry.
export function createWakeFailures({ retryBase = WAKE_RETRY_BASE,
                                     retryMax = WAKE_RETRY_MAX,
                                     now = Date.now, log } = {}) {
  // id -> { count, retryAt, opened }
  const failures = new Map();

  return {
    wakeTimeFor(id, item) {
      const time = itemWakeTime(item);
      const failure = failures.get(id);
      return failure ? Math.max(time, failure.retryAt) : time;
    },

    // `opened`: the tab exists and only the removal failed. Sticky, so a retry
    // never opens a second tab.
    noteFailure(id, item, reason, { opened = false } = {}) {
      const previous = failures.get(id);
      const count = previous ? previous.count + 1 : 1;
      const delay = Math.min(retryBase * Math.pow(2, count - 1), retryMax);
      failures.set(id, {
        count,
        retryAt: now() + delay,
        opened: opened || Boolean(previous && previous.opened)
      });
      log('wake failed for', item.url, reason, '- retrying in', delay, 'ms');
    },

    hasOpened(id) {
      const failure = failures.get(id);
      return Boolean(failure && failure.opened);
    },

    forget(id) {
      failures.delete(id);
    },

    // Entries also disappear when the user cancels them.
    forgetMissing(items) {
      for (const id of [...failures.keys()]) {
        if (!(id in items)) { failures.delete(id); }
      }
    }
  };
}

// When the wake alarm should next fire, or null if nothing is schedulable.
export function nextWakeAlarmTime(items, now,
                                  { wakeTimeFor = (id, item) => itemWakeTime(item),
                                    minDelay = MIN_WAKE_DELAY } = {}) {
  const wakeTimes = Object.entries(items)
    .map(([id, item]) => wakeTimeFor(id, item))
    .filter(Number.isFinite);
  if (!wakeTimes.length) { return null; }

  // Not sort(): without a comparator it compares as strings.
  return Math.max(Math.min(...wakeTimes), now + minDelay);
}

// Runs doWake one at a time. Waking is a read-modify-write on storage.local,
// so overlapping runs open the same tab twice. An in-memory guard is enough
// for a persistent MV2 background page.
export function createWakeCoordinator(doWake, log) {
  let inFlight = null;
  let queued = false;

  function takeQueued() {
    if (!queued) { return false; }
    queued = false;
    return true;
  }

  async function drain() {
    try {
      do {
        try {
          await doWake();
        } catch (reason) {
          // Caught per run, so a queued request still runs after a failure.
          log('wake failed', reason);
        }
      } while (takeQueued());
    } finally {
      inFlight = null;
    }
  }

  return function requestWake() {
    // Coalesce into one follow-up run, for entries that came due mid-run.
    if (inFlight) {
      queued = true;
      return inFlight;
    }
    // Reset here, not in drain: drain starts a microtask later and would drop
    // a request made in between.
    queued = false;
    // Deferred so inFlight is set before drain's finally clears it, even if
    // doWake throws synchronously.
    inFlight = Promise.resolve().then(drain);
    return inFlight;
  };
}

// Opens an entry's tab, removes the entry, then announces it. The removal must
// not depend on the announcement: an entry that outlives its tab reopens on
// every alarm (#455). Never rejects, so one bad entry can't abort the batch.
export async function wakeItem({ id, item, failures, createTab, removeEntry,
                                 announce, log }) {
  let tab = null;

  // An earlier attempt opened the tab but failed to remove the entry.
  if (!failures.hasOpened(id)) {
    try {
      tab = await createTab(item);
    } catch (reason) {
      // No tab: keep the entry and back off.
      failures.noteFailure(id, item, reason);
      return;
    }
  }

  try {
    await removeEntry(id);
  } catch (reason) {
    failures.noteFailure(id, item, reason, { opened: true });
    return;
  }
  failures.forget(id);

  // Not awaited, and errors are only logged: the tab is already woken.
  if (tab) {
    try {
      announce(item, tab);
    } catch (reason) {
      log('wake follow-up threw for', item.url, reason);
    }
  }
}
