/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, browser:true, white:true,
moz:true, esnext:false, indent:2, maxerr:50, devel:true, node:true, boss:true,
globalstrict:true, nomen:false, newcap:false */

"use strict";

/* document --> plugin */
document.addEventListener('chromeEvent', function(e) {
  self.port.emit('chromeEvent', e.detail);
  return true;
});

/* plugin --> document */
self.port.on('emit', function (e) {
  document.defaultView.postMessage(e, '*');
  return true;
});
