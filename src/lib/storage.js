import uuidV4 from 'uuid/v4';

export const KEY_BOOKMARK_FOLDER_UUID = 'bookmarkFolderUUID';
// Former name of KEY_BOOKMARK_FOLDER_UUID, from when the UUID doubled as the
// analytics client ID. Stays a known property so that a leftover value is
// never read as an alarm.
export const KEY_LEGACY_METRICS_UUID = 'metricsUUID';
export const KEY_DONT_SHOW = 'dontShow';

export const KNOWN_PROPERTIES = [
  KEY_DONT_SHOW,
  KEY_BOOKMARK_FOLDER_UUID,
  KEY_LEGACY_METRICS_UUID
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

// Shared so concurrent first calls store one UUID.
let pendingBookmarkFolderUUID = null;

// The UUID names this install's bookmark folder, so changing it would orphan
// that folder. A value under the legacy key is moved over as is.
export function getBookmarkFolderUUID() {
  if (!pendingBookmarkFolderUUID) {
    pendingBookmarkFolderUUID = lookUpBookmarkFolderUUID().finally(() => {
      pendingBookmarkFolderUUID = null;
    });
  }
  return pendingBookmarkFolderUUID;
}

function lookUpBookmarkFolderUUID() {
  const keys = [KEY_BOOKMARK_FOLDER_UUID, KEY_LEGACY_METRICS_UUID];
  return browser.storage.local.get(keys).then(raw => {
    // Return the existing UUID, if found.
    const existing = raw[KEY_BOOKMARK_FOLDER_UUID];
    if (existing) { return existing; }

    // Otherwise, adopt the legacy UUID or generate a new one, and return it
    // after storing it.
    const legacy = raw[KEY_LEGACY_METRICS_UUID];
    const update = {};
    update[KEY_BOOKMARK_FOLDER_UUID] = legacy || uuidV4();
    return browser.storage.local.set(update)
      .then(() => legacy && browser.storage.local.remove(KEY_LEGACY_METRICS_UUID))
      .then(() => update[KEY_BOOKMARK_FOLDER_UUID]);
  });
}
