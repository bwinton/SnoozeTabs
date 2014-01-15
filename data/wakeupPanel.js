/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, browser:true, white:true,
moz:true, esnext:false, indent:2, maxerr:50, devel:true, node:true, boss:true,
globalstrict:true, nomen:false, newcap:false */
 
"use strict";

/* Send a message to the add-on. */
var sendChromeEvent = function (kind, data) {
  var event = new CustomEvent('chromeEvent', {'detail': {'kind': kind, 'data': data}});
  document.dispatchEvent(event);
};

var handleBookmark = function (aBookmark) {
  var $ = document.querySelector.bind(document);
  var url = $('#middle .url');
  var bookmark = JSON.parse(aBookmark);

  url.textContent = bookmark.title;
  url.setAttribute('href', bookmark.url);
  url.onclick = function urlClicked(e) {
    sendChromeEvent('bookmarkClicked', bookmark.url);
    e.preventDefault();
    return false;
  }
};

window.onload = function load() {
  var bookmark = atob(window.location.search.replace('?b=', ''));
  if (bookmark) {
    handleBookmark(bookmark);
  }
}

window.addEventListener('message', function (event) {
  var data = event.data;
  if (data.type === 'newBookmark') {
    handleBookmark(data.data);
  }
});
