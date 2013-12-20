/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
 
/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, browser:true, white:true,
moz:true, esnext:false, indent:2, maxerr:50, devel:true, node:true, boss:true,
globalstrict:true, nomen:false, newcap:false */
 
"use strict";

window.onload = function load() {
  console.log("Loaded…");
  var $ = document.querySelector.bind(document);
  var $all = document.querySelectorAll.bind(document);
  $('#middle').onclick = function buttonClicked(e) {
    var classList = e.originalTarget.classList;
    if (!classList.contains("button")) {
      return;
    }
    console.log(classList.item(1));
  }
}
