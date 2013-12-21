/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, browser:true, white:true,
moz:true, esnext:false, indent:2, maxerr:50, devel:true, node:true, boss:true,
globalstrict:true, nomen:false, newcap:false */

"use strict";

var data = require("sdk/self").data;
var Panel = require("sdk/panel").Panel;
var prefs = require('sdk/simple-prefs');
// var micropilot = require('./micropilot');
var Widget = require("sdk/widget").Widget;

const STUDY_ID = 'snoozetabs';
const UPLOAD_URL = 'https://snoozetabs.paas.allizom.org/data/' + STUDY_ID;


var makeContent = function (image) {
  return '<html>\n' +
         '  <head>\n' +
         '    <style>\n' +
         '      body {\n' +
         '        margin: 0;\n' +
         '        padding: 0;\n' +
         '        width: 100%;\n' +
         '        height: 100%;\n' +
         '        background-repeat: no-repeat;\n' +
         '        background-size: contain;\n' +
         '        background-image: url("' + data.url(image) + '");\n' +
         '      }\n' +
         '      @media (min-resolution: 2dppx) {\n' +
         '        body {\n' +
         '          background-image: url("' + data.url(image.replace(".png", "@2x.png")) + '");\n' +
         '        }\n' +
         '      }\n' +
         '    </style>\n' +
         '  </head>\n' +
         '  <body></body>\n' +
         '</html>\n';
}


exports.main = function () {
  var snoozePanel = Panel({
    width:240,
    height:350,
    contentURL: data.url('panelContent.html'),
    contentScript: 'window.addEventListener("chromeEvent", function(e) {self.port.emit("chromeEvent", e.detail); return true;});',
    onShow: function () {
      widget.content = makeContent('SnoozeTabsButton.png');
    },
    onHide: function () {
      widget.content = makeContent('SnoozeTabsButtonGrey.png');
    }
  });

  snoozePanel.port.on("chromeEvent", function (e) {
  });

  var widget = Widget({
    id: 'snoozetabs-btn',
    label: 'Snooze',
    content: makeContent('SnoozeTabsButtonGrey.png'),
    panel: snoozePanel
  });
};

exports.onUnload = function () {
};