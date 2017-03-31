import uuidV4 from 'uuid/v4';
import { NEXT_OPEN } from './times';

export const KEY_METRICS_UUID = 'metricsUUID';
export const KEY_DONT_SHOW = 'dontShow';

export const KNOWN_PROPERTIES = [
  KEY_DONT_SHOW,
  KEY_METRICS_UUID
];

export function getAlarmsAndProperties() {
  return browser.storage.local.get().then(raw => Object.keys(raw)
    .reduce((obj, key) => {
      if (KNOWN_PROPERTIES.indexOf(key) !== -1) {
        obj[key] = raw[key];
      } else {
        obj.alarms[key] = raw[key];
      }
      return obj;
    }, { alarms: {} }));
}

export function getAlarms() {
  return getAlarmsAndProperties().then(data => data.alarms);
}

export function getNextOpenAlarms() {
  return getAlarms().then(items => {
    return Object.values(items).filter(item => item.time === NEXT_OPEN);
  });
}

export function saveAlarms(update) {
  return browser.storage.local.set(Object.keys(update)
    .reduce((obj, key) => {
      if (KNOWN_PROPERTIES.indexOf(key) === -1) {
        obj[key] = update[key];
      }
      return obj;
    }, {}));
}

export function removeAlarms(keysIn) {
  const keys = Array.isArray(keysIn) ? keysIn : [ keysIn ];
  return browser.storage.local
    .remove(keys.filter(key => KNOWN_PROPERTIES.indexOf(key) === -1));
}

export function getDontShow() {
  return browser.storage.local.get(KEY_DONT_SHOW).then(data => data[KEY_DONT_SHOW]);
}

export function setDontShow(value) {
  const update = {};
  update[KEY_DONT_SHOW] = value;
  return browser.storage.local.set(update);
}

export function getMetricsUUID() {
  return browser.storage.local.get(KEY_METRICS_UUID).then(raw => {
    // Return the existing UUID, if found.
    const existing = raw[KEY_METRICS_UUID];
    if (existing) { return existing; }

    // Otherwise, generate a new UUID and return it after storing it.
    const update = {};
    update[KEY_METRICS_UUID] = uuidV4();
    return browser.storage.local.set(update)
      .then(() => update[KEY_METRICS_UUID]);
  });
}
