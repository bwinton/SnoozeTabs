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
var { defer } = require('sdk/core/promise');
var tabs = require('sdk/tabs');

const ONE_HOUR = 1000 * 60 * 60;

const TWO_HOURS = ONE_HOUR * 2;
// THIS_EVENING = after 7pm.
const ONE_DAY = ONE_HOUR * 24;
// THIS_WEEKEND = Saturday.
const ONE_WEEK = ONE_DAY * 7;
// NEXT_MONTH = +one month.
// RAINY_DAY = random in the next six months.


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

var handlers = {
  'missing': function (snoozeGroup, handler) {
    console.log('Missing handler for', handler);
    return;
  },
  'laterToday': function (snoozeGroup) {
    var updated = new Date().valueOf() + TWO_HOURS;
    var bookmark = bookmarks.Bookmark({
      title: tabs.activeTab.title,
      url: tabs.activeTab.url,
      group: snoozeGroup,
      tags: ['snoozed:' + updated]
    });
    bookmarks.save(bookmark);
    return;
  },
  'tomorrow': function (snoozeGroup) {
    var updated = new Date().valueOf() + ONE_DAY;
    var bookmark = bookmarks.Bookmark({
      title: tabs.activeTab.title,
      url: tabs.activeTab.url,
      group: snoozeGroup,
      tags: ['snoozed:' + updated]
    });
    bookmarks.save(bookmark);
    return;
  },
};

exports.handleEvent = function (kind, data) {
  if (kind != 'buttonClicked') {
    console.log('Unknown message of', kind, data);
    return;
  }
  getSnoozedGroup().then(function (group) {
    var handler = handlers[data] || handlers.missing;
    handler(group, data);
  });
    
  return;
};
