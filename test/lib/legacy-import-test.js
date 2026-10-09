import { expect } from 'chai';

import { findLegacyFolders, legacyEntries } from '../../src/lib/legacy-import';

const OLD_UUID = '1b4e28ba-2fa1-41d2-883f-0016d3cca427';
const OTHER_UUID = '6fa459ea-ee8a-4ca4-894e-db77e160355e';

const germanTitle = uuid => `Schlummernde Tabs – ${uuid}`;

function bookmark(url, title = url) {
  return { type: 'bookmark', title, url };
}

function folder(title, children = []) {
  return { type: 'folder', title, children };
}

function tree(...children) {
  return [folder('', [folder('Other Bookmarks', children)])];
}

describe('lib/legacy-import', () => {
  describe('findLegacyFolders()', () => {
    it('finds an English folder of another install', () => {
      const old = folder(`Snoozed Tabs - ${OLD_UUID}`);
      expect(findLegacyFolders(tree(old), germanTitle)).to.deep.equal([old]);
    });

    it('finds a folder in the current locale', () => {
      const old = folder(germanTitle(OLD_UUID));
      expect(findLegacyFolders(tree(old), germanTitle)).to.deep.equal([old]);
    });

    it('finds folders at any depth', () => {
      const old = folder(`Snoozed Tabs - ${OLD_UUID}`);
      const other = folder(`Snoozed Tabs - ${OTHER_UUID}`);
      const found = findLegacyFolders(tree(folder('Nested', [old]), other),
                                      germanTitle);
      expect(found).to.have.members([old, other]);
    });

    it('skips folders of the new add-on, synced from any device', () => {
      const synced = folder(`Snoozed Tabs (${OTHER_UUID})`);
      expect(findLegacyFolders(tree(synced), germanTitle)).to.be.empty;
    });

    it('skips folders renamed on reinstall', () => {
      const renamed = folder(`Snoozed Tabs - ${OLD_UUID} - 2018-02-16 10:00`);
      expect(findLegacyFolders(tree(renamed), germanTitle)).to.be.empty;
    });

    it('skips other folders and bookmarks with a UUID in the title', () => {
      const unrelated = folder(`Backup ${OLD_UUID}`);
      const mark = bookmark('https://example.com/', `Snoozed Tabs - ${OLD_UUID}`);
      expect(findLegacyFolders(tree(unrelated, mark), germanTitle)).to.be.empty;
    });
  });

  describe('legacyEntries()', () => {
    it('turns bookmarks into entries waking at the given time', () => {
      const old = folder('', [bookmark('https://a.example/', 'A')]);
      expect(legacyEntries([old], {}, 'next')).to.deep.equal([
        { title: 'A', url: 'https://a.example/', time: 'next' }
      ]);
    });

    it('falls back to the URL for an untitled bookmark', () => {
      const old = folder('', [bookmark('https://a.example/', '')]);
      expect(legacyEntries([old], {}, 'next')[0].title).to.equal('https://a.example/');
    });

    it('keeps one entry per URL across folders', () => {
      const one = folder('', [bookmark('https://a.example/'), bookmark('https://b.example/')]);
      const two = folder('', [bookmark('https://a.example/')]);
      const urls = legacyEntries([one, two], {}, 'next').map(entry => entry.url);
      expect(urls).to.deep.equal(['https://a.example/', 'https://b.example/']);
    });

    it('skips URLs that are already snoozed', () => {
      const old = folder('', [bookmark('https://a.example/'), bookmark('https://b.example/')]);
      const existing = { 'x': { url: 'https://a.example/', time: 1234 } };
      const urls = legacyEntries([old], existing, 'next').map(entry => entry.url);
      expect(urls).to.deep.equal(['https://b.example/']);
    });

    it('skips separators and subfolders', () => {
      const old = folder('', [
        { type: 'separator', title: '', url: 'data:' },
        folder('Sub', [bookmark('https://a.example/')])
      ]);
      expect(legacyEntries([old], {}, 'next')).to.be.empty;
    });

    it('yields nothing for no folders', () => {
      expect(legacyEntries([], {}, 'next')).to.be.empty;
    });
  });
});
