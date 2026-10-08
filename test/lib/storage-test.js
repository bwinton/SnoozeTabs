import { expect } from 'chai';
import sinon from 'sinon';

import { KNOWN_PROPERTIES, KEY_BOOKMARK_FOLDER_UUID, KEY_LEGACY_METRICS_UUID,
         KEY_DONT_SHOW,
         getAlarms, saveAlarms, removeAlarms,
         getAlarmsAndProperties, getBookmarkFolderUUID,
         getDontShow, setDontShow } from '../../src/lib/storage';

describe('lib/storage', () => {

  let mockStorage;

  beforeEach(() => {
    mockStorage = {
      alarm1: true,
      alarm2: true
    };
    KNOWN_PROPERTIES.forEach(name => mockStorage[name] = true);

    global.browser = {
      storage: {
        local: {
          get: sinon.spy(() => new Promise(resolve =>
            resolve(mockStorage))),
          set: sinon.spy(update => new Promise(resolve => {
            mockStorage = { ...mockStorage, ...update };
            resolve(mockStorage);
          })),
          remove: sinon.spy(keysIn => new Promise(resolve => {
            const keys = Array.isArray(keysIn) ? keysIn : [keysIn];
            keys.forEach(key => delete mockStorage[key]);
            resolve(mockStorage);
          }))
        }
      }
    };
  });

  it('offers KNOWN_PROPERTIES', () => {
    expect(KNOWN_PROPERTIES).to.exist;
  });

  it('supports getAlarms() filtering out known properties', done => {
    getAlarms().then(items => {
      expect(global.browser.storage.local.get.called).to.be.true;
      expect(Object.keys(items)).to.not.include.members(KNOWN_PROPERTIES);
      done();
    }).catch(err => {
      expect(err).to.not.exist;
      done();
    });
  });

  it('support saveAlarms() that filters out known properties', done => {
    const update = {
      alarm3: 'expectme',
      alarm4: 'expectme'
    };
    update[KEY_BOOKMARK_FOLDER_UUID] = 'dontexpectme';
    saveAlarms(update).then(() => {
      expect(global.browser.storage.local.set.called).to.be.true;
      expect(mockStorage.alarm3).to.equal(update.alarm3);
      expect(mockStorage.alarm4).to.equal(update.alarm4);
      expect(mockStorage[KEY_BOOKMARK_FOLDER_UUID]).to.not.equal(update[KEY_BOOKMARK_FOLDER_UUID]);
      done();
    }).catch(err => {
      expect(err).to.not.exist;
      done();
    });
  });

  it('supports removeAlarms() that filters out known properties', done => {
    const toRemove = ['alarm1', 'alarm2', KEY_BOOKMARK_FOLDER_UUID];
    removeAlarms(toRemove).then(() => {
      expect(global.browser.storage.local.remove.called).to.be.true;
      expect(mockStorage.alarm1).to.not.exist;
      expect(mockStorage.alarm2).to.not.exist;
      expect(mockStorage[KEY_BOOKMARK_FOLDER_UUID]).to.exist;
      done();
    }).catch(err => {
      expect(err).to.not.exist;
      done();
    });
  });

  it('supports removeAlarms() that takes a single key', done => {
    const toRemove = 'alarm1';
    removeAlarms(toRemove).then(() => {
      expect(global.browser.storage.local.remove.called).to.be.true;
      expect(mockStorage.alarm1).to.not.exist;
      done();
    }).catch(err => {
      expect(err).to.not.exist;
      done();
    });
  });

  it('supports getAlarmsAndProperties() separating alarms from properties', done => {
    getAlarmsAndProperties().then(data => {
      expect(global.browser.storage.local.get.called).to.be.true;
      expect(Object.keys(data)).to.have.members([...KNOWN_PROPERTIES, 'alarms']);
      expect(Object.keys(data.alarms)).to.not.include.members(KNOWN_PROPERTIES);
      done();
    }).catch(err => {
      expect(err).to.not.exist;
      done();
    });
  });

  it('supports getDontShow() that fetches the value', done => {
    const expectedValue = mockStorage[KEY_DONT_SHOW] = 'expecteme';
    getDontShow().then(resultValue => {
      expect(global.browser.storage.local.get.called).to.be.true;
      expect(resultValue).to.equal(expectedValue);
      done();
    }).catch(err => {
      expect(err).to.not.exist;
      done();
    });
  });

  it('supports setDontShow() that stores the value', done => {
    delete mockStorage[KEY_DONT_SHOW];
    const expectedValue = 'setme';
    setDontShow(expectedValue).then(() => {
      expect(global.browser.storage.local.set.called).to.be.true;
      expect(mockStorage[KEY_DONT_SHOW]).to.equal(expectedValue);
      done();
    }).catch(err => {
      expect(err).to.not.exist;
      done();
    });
  });

  it('supports getBookmarkFolderUUID() that auto-generates a UUID the first time', done => {
    delete mockStorage[KEY_BOOKMARK_FOLDER_UUID];
    delete mockStorage[KEY_LEGACY_METRICS_UUID];
    getBookmarkFolderUUID().then(resultUUID => {
      expect(global.browser.storage.local.get.called).to.be.true;
      expect(global.browser.storage.local.set.called).to.be.true;
      expect(resultUUID).to.exist;
      done();
    }).catch(err => {
      expect(err).to.not.exist;
      done();
    });
  });

  it('supports getBookmarkFolderUUID() that yields the existing UUID', done => {
    const expectedUUID = mockStorage[KEY_BOOKMARK_FOLDER_UUID] = '8675309';
    getBookmarkFolderUUID().then(resultUUID => {
      expect(resultUUID).to.equal(expectedUUID);
      expect(global.browser.storage.local.set.called).to.be.false;
      done();
    }).catch(err => {
      expect(err).to.not.exist;
      done();
    });
  });

  it('supports getBookmarkFolderUUID() that moves a legacy UUID over unchanged', done => {
    delete mockStorage[KEY_BOOKMARK_FOLDER_UUID];
    const expectedUUID = mockStorage[KEY_LEGACY_METRICS_UUID] = '8675309';
    getBookmarkFolderUUID().then(resultUUID => {
      expect(resultUUID).to.equal(expectedUUID);
      expect(mockStorage[KEY_BOOKMARK_FOLDER_UUID]).to.equal(expectedUUID);
      expect(mockStorage[KEY_LEGACY_METRICS_UUID]).to.not.exist;
      done();
    }).catch(err => {
      expect(err).to.not.exist;
      done();
    });
  });

});
