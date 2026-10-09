/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

// Finds tabs snoozed by an earlier install, kept free of browser.* so it can
// be unit tested. background.js wires it up.
//
// The add-on moved to a new ID, so the storage of the old install is out of
// reach. What remains is its bookmark folder, "Snoozed Tabs - <uuid>", which
// lists the title and URL of each snoozed tab but not when it should wake.
//
// Firefox Sync copies these folders between devices, and add-ons can't tell
// which device a folder belongs to. So the new add-on names its own folder
// "Snoozed Tabs (<uuid>)", and only folders in the old format count.

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

// Title the old add-on gave its folder before Pontoon localised it.
const englishFolderTitle = uuid => `Snoozed Tabs - ${uuid}`;

// Snooze folders of the old add-on in a bookmarks.getTree() result.
// folderTitle(uuid) gives its localised folder title. Folders renamed with a
// date suffix on reinstall don't match: they were already orphaned.
export function findLegacyFolders(tree, folderTitle) {
  const found = [];
  const visit = node => {
    if (node.url || !node.children) { return; }
    const match = UUID_PATTERN.exec(node.title || '');
    if (match &&
        [folderTitle(match[0]), englishFolderTitle(match[0])].includes(node.title)) {
      found.push(node);
    }
    node.children.forEach(visit);
  };
  tree.forEach(visit);
  return found;
}

// Entries to store for the tabs in the found folders, one per URL, each
// waking at the given time. Skips URLs that are already snoozed.
export function legacyEntries(folders, existingAlarms, time) {
  const snoozed = new Set(Object.values(existingAlarms).map(item => item.url));
  const entries = new Map();
  for (const folder of folders) {
    for (const child of folder.children) {
      if (!child.url || child.type === 'separator') { continue; }
      if (snoozed.has(child.url) || entries.has(child.url)) { continue; }
      entries.set(child.url, { title: child.title || child.url, url: child.url, time });
    }
  }
  return [...entries.values()];
}
