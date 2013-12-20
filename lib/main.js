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


exports.main = function () {
  // study.start();

  // Your code here…
  var snoozePanel = Panel({
    width:240,
    height:350,
    contentURL: data.url('panelContent.html'),
    contentScript: 'window.addEventListener("chromeEvent", function(e) {self.port.emit("chromeEvent", e.detail); return true;});',
    onShow: function () {
      widget.contentURL = data.url('SnoozeTabsButton.png');
    },
    onHide: function () {
      widget.contentURL = data.url('SnoozeTabsButtonGrey.png');
    }
  });

  snoozePanel.port.on("chromeEvent", function (e) {
    console.log("Received chromeEvent:", e.kind, e.data);
  });

  var widget = Widget({
    id: 'snoozetabs-btn',
    label: 'Snooze',
    contentURL: data.url('SnoozeTabsButtonGrey.png'),
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