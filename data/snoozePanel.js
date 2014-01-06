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
  window.dispatchEvent(event);
};

window.onload = function load() {
  var $ = document.querySelector.bind(document);
  var $all = document.querySelectorAll.bind(document);
  $('#middle').onclick = function buttonClicked(e) {
    var classList = e.originalTarget.classList;
    if (!classList.contains("button")) {
      return;
    }
    if (classList.contains("pickADate")) {
      $('#buttons').style.marginLeft = "-220px";
    }
    sendChromeEvent("buttonClicked", classList.item(1));
  }

  $('#calendar').onclick = function calendarClicked(e) {
    $('#buttons').style.marginLeft = "0px";
  }

  var bookmark = atob(window.location.search.replace('?b=', ''));
  if (bookmark) {
    console.log("BW4", bookmark);
  }
}
