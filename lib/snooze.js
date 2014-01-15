/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, browser:true, white:true,
moz:true, esnext:false, indent:2, maxerr:50, devel:true, node:true, boss:true,
globalstrict:true, nomen:false, newcap:false */

"use strict";

var bookmarks = require('sdk/places/bookmarks');
var {defer} = require('sdk/core/promise');
let {getFavicon} = require('sdk/places/favicon');
var {prefs} = require('sdk/simple-prefs');
var tabs = require('sdk/tabs');

var ONE_HOUR = 1000 * 60 * 60;
if (prefs.hyperspeed) {
  ONE_HOUR = 1000 * 1; // For testing, an hour is a mere second…
}

var TWO_HOURS = ONE_HOUR * 2;
// THIS_EVENING = after 7pm.
var ONE_DAY = ONE_HOUR * 24;
// THIS_WEEKEND = Saturday.
var ONE_WEEK = ONE_DAY * 7;
// NEXT_MONTH = +one month.
// RAINY_DAY = random in the next six months.

const SNOOZED_TAG = 'snoozed:';
const THUMB_TAG = 'thumb:';


var getSnoozedGroup = function () {
  var deferred = defer();

  bookmarks.search(
    { group: bookmarks.UNSORTED },
    { sort: 'date' }
  ).on('end', function (results) {
    var groups = results.filter(function(item) {
      return item.type === 'group' && item.title === 'Snoozed Tabs';
    });
    if (groups.length > 0) {
      deferred.resolve(groups[0]);
    } else {
      deferred.resolve(bookmarks.Group({title: 'Snoozed Tabs'}));
    }
  });
  return deferred.promise;
};

var getSnoozedBookmarks = function () {
  var deferred = defer();

  bookmarks.search(
    { group: bookmarks.UNSORTED },
    { sort: 'date' }
  ).on('end', function (results) {
    var groups = results.filter(function(item) {
      return item.type === 'group' && item.title === 'Snoozed Tabs';
    });
    if (groups.length <= 0) {
      deferred.resolve([]);
      return;
    }

    bookmarks.search({ group: groups[0] }).on('end', function (results) {
      deferred.resolve(results);
    });
  });
  return deferred.promise;
}

var saveTab = function (deferred, snoozeGroup, updated) {
  var bookmark = getBookmark(snoozeGroup, updated).then(function (bookmark) {
    bookmarks.save(bookmark).on("end", function (result) {
      deferred.resolve(bookmark.url);
    });
  });
};

var getBookmark = function (snoozeGroup, updated) {
  var deferred = defer();
  var tab = tabs.activeTab;

  getFavicon(tab).then(function (favicon) {
    var bookmark = bookmarks.Bookmark({
      title: tab.title,
      url: tab.url,
      group: snoozeGroup,
      tags: [SNOOZED_TAG + updated, THUMB_TAG + favicon]
    });
    deferred.resolve(bookmark);
  });
  return deferred.promise;
};

exports.getThumbnail = function (bookmark) {
  for (let tag of bookmark.tags) {
    if (tag.startsWith(THUMB_TAG)) {
      return tag.substring(THUMB_TAG.length)
    }
  }
}

var handlers = {
  'missing': function (deferred, snoozeGroup, handler) {
    console.log('Missing handler for', handler);
    deferred.reject('Missing handler for', handler);
  },
  'laterToday': TWO_HOURS,
  'tomorrow': ONE_DAY
};

exports.handleEvent = function (kind, data) {
  var deferred = defer();

  if (kind != 'buttonClicked') {
    console.log('Unknown message of', kind, data);
    return;
  }
  getSnoozedGroup().then(function (group) {
    var handler = handlers[data] || handlers.missing;
    if (typeof(handler) === 'number') {
      saveTab(deferred, group, new Date().valueOf() + handler);
    } else {
      handler(deferred, group, data);
    }
  });
    
  return deferred.promise;
};

exports.getNextWakeup = function () {
  var deferred = defer();

  getSnoozedBookmarks().then(function (bookmarks) {
    var sortedBookmarks = [];
    var rightNow = new Date().valueOf();
    for (let bookmark of bookmarks) {
      for (let tag of bookmark.tags) {
        if (tag.startsWith(SNOOZED_TAG)) {
          sortedBookmarks.push([
            Math.max(parseInt(tag.substring(SNOOZED_TAG.length), 10) - rightNow, 0),
            bookmark
          ]);
        }
      }
    };
    sortedBookmarks.sort();
    var next = [TWO_HOURS, undefined];
    if (sortedBookmarks.length > 0) {
      next = sortedBookmarks[0];
    }

    deferred.resolve({timeout: next[0], bookmark: next[1]});
  })
  return deferred.promise;
};

exports.opened = function (bookmark) {
  bookmarks.save(bookmarks. remove(bookmark)).on("end", function (results) {
  });
};