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
var THREE_HOURS = ONE_HOUR * 3;
var ONE_DAY = ONE_HOUR * 24;
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
  console.log("Saving " + tabs.activeTab.title + " until " + new Date(updated).toString());
  var bookmark = getBookmark(snoozeGroup, updated).then(function (bookmark) {
    bookmarks.save(bookmark).on("end", function (result) {
      deferred.resolve(bookmark.url);
    });
  }, function (error) {
    console.log("BW 3 Error - ", error);
  });
};

var getBookmark = function (snoozeGroup, updated) {
  var deferred = defer();
  var tab = tabs.activeTab;

  var handleFavicon = function (favicon) {
    var tags = [SNOOZED_TAG + updated];
    if (favicon) {
      tags.push(THUMB_TAG + favicon);
    }
    var bookmark = bookmarks.Bookmark({
      title: tab.title,
      url: tab.url,
      group: snoozeGroup,
      tags: tags
    });
    deferred.resolve(bookmark);
  };

  getFavicon(tab).then(handleFavicon, function (error) {
    handleFavicon(null);
  });
  return deferred.promise;
};

exports.getThumbnail = function (bookmark) {
  for (let tag of bookmark.tags) {
    if (tag.startsWith(THUMB_TAG)) {
      return tag.substring(THUMB_TAG.length)
    }
  }
  return null;
}

var handlers = {
  'laterToday': THREE_HOURS,
  'tonight': function () {
    var now = new Date();

    if (now.getHours() > 19) {
      now.setHours(43); // 19:00 tomorrow.
    } else {
      now.setHours(19); // 19:00 today.
    }
    return now.valueOf();
  },
  'tomorrow': ONE_DAY,
  'thisWeekend': function () {
    var now = new Date();
    var day = now.getDay();

    if (day == 6) {
      now.setDate(now.getDate() + 1); // Tomorrow/Sunday.
    } else {
      now.setDate(now.getDate() + 6 - day); // Saturday.
    }
    return now.valueOf();
  },
  'nextWeek': ONE_WEEK,
  'nextMonth': function () {
    var now = new Date();
    now.setMonth(now.getMonth() + 1); // Next month, -ish.
    return now.valueOf();
  },
  'rainyDay': function () {
    var now = new Date();
    var low = now.valueOf();
    now.setMonth(now.getMonth() + 6); // Next month, -ish.
    var high = now.valueOf();
    var rainyDay = Math.random() * (high - low) + low;
    return rainyDay;
  },
  'whenImFree': TWO_HOURS,
  // 'pickADate': TWO_HOURS,
};

exports.handleEvent = function (kind, data) {
  if (kind != 'buttonClicked') {
    console.log('Unknown message of', kind, data);
    return;
  }

  var handler = handlers[data];
  if (!handler) {
    console.log('Missing handler for', handler);
    return;
  }

  var deferred = defer();
  getSnoozedGroup().then(function (group) {
    var updated = 0;
    if (typeof(handler) === 'number') {
      updated = new Date().valueOf() + handler;
    } else {
      updated = handler();
    }
    saveTab(deferred, group, updated);
  }, function (error) {
    console.log("BW 1 Error - ", error);
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
  }, function (error) {
    console.log("BW 2 Error - ", error);
  });
  return deferred.promise;
};

exports.opened = function (bookmark) {
  bookmarks.save(bookmarks. remove(bookmark)).on("end", function (results) {
  });
};