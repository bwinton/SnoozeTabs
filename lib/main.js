/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

"use strict";

var data = require("sdk/self").data;
var Panel = require("sdk/panel").Panel;
var prefs = require('sdk/simple-prefs');
// var micropilot = require('./micropilot');
var Widget = require("sdk/widget").Widget;

const STUDY_ID = 'snoozetabs';
const UPLOAD_URL = 'https://snoozetabs.paas.allizom.org/data/' + STUDY_ID;

// var study = micropilot.Micropilot(STUDY_ID);

// var registerListener = debounce(function () {
//   study.record({
//     id: 'registration_attempted',
//     ts: Date.now(),
//   });
//   study.ezupload({
//     url: UPLOAD_URL //, simulate: true
//   });
// }, 1000);

var makeContent = function (image) {
  return '<html>\n' +
         '  <head>\n' +
         '    <style>\n' +
         '      body {\n' +
         '        margin: 0;\n' +
         '        padding: 0;\n' +
         '        width: 16px;\n' +
         '        height: 16px;\n' +
         '        background-repeat: no-repeat;\n' +
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
  // study.start();

  // Your code here…
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
    console.log("Received chromeEvent:", e.kind, e.data);
  });

  var widget = Widget({
    id: 'snoozetabs-btn',
    label: 'Snooze',
    content: makeContent('SnoozeTabsButtonGrey.png'),
    panel: snoozePanel
  });

  // prefs.on('register2', registerListener);
  // registerListener();
};

exports.onUnload = function () {
  // prefs.removeListener('register2', registerListener);
  
    // Your code here…
  
  // study.ezupload({
  //   url: UPLOAD_URL //, simulate: true
  // });

};