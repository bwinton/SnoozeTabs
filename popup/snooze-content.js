/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

// @flow

document.addEventListener('click', function (e:MouseEvent) {
  if (!e.target.classList.contains("page-choice")) {
    return;
  }
  var chosenPage: string = e.target.textContent;

}, true);