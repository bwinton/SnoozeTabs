/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*jshint forin:true, noarg:true, noempty:true, eqeqeq:true, bitwise:true,
strict:true, undef:true, unused:true, curly:true, browser:true, white:true,
moz:true, esnext:false, indent:2, maxerr:50, devel:true, node:true, boss:true,
globalstrict:true, nomen:false, newcap:false */

"use strict";

var base64 = require('sdk/base64');
var chrome = require('chrome');
var {data} = require('sdk/self');
var {Panel} = require('sdk/panel');
var prefs = require('sdk/simple-prefs');
// var micropilot = require('./micropilot');
var {setTimeout, clearTimeout} = require('sdk/timers');
var snooze = require('./snooze');
var tabs = require('sdk/tabs');
var {Widget} = require('sdk/widget');

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
};

/**
 * The things I do to get an attached panel to show up.  Seriously.
 */
var showPanel = function (panel) {
  var wm = chrome.Cc["@mozilla.org/appshell/window-mediator;1"]
                     .getService(chrome.Ci.nsIWindowMediator);
  var win = wm.getMostRecentWindow("navigator:browser");
  var widgetElem = win.document.getElementById("widget:jid1-snoozetabs@jetpack-snoozetabs-btn");
  panel.show(null, widgetElem);
  console.log(panel);
};


var wakeupId;
var nextWakeup = function (widget, bookmark) {
  // Do something with the bookmark.
  if (bookmark) {
    // tabs.open({url: bookmark.url});
    var encodedURL = base64.encode(bookmark.url, "utf-8");
    widget.panel.contentURL = data.url('panelContent.html?b=' + encodedURL);
    showPanel(widget.panel);
    snooze.opened(bookmark);
  }

  // And snooze until it's time to wake up next.
  snooze.getNextWakeup().then(function (result) {
    wakeupId = setTimeout(nextWakeup, result.timeout, widget, result.bookmark);
  });
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
    snooze.handleEvent(e.kind, e.data).then(function (url) {
      if (tabs.activeTab.url === url) {
        tabs.activeTab.close()
      } else {
        for each (var tab in tabs) {
          if (tab.url === url) {
            tab.close();
            break;
          }
        }
      }
      snoozePanel.hide();
    });
  });

  var widget = Widget({
    id: 'snoozetabs-btn',
    label: 'Snooze',
    content: makeContent('SnoozeTabsButtonGrey.png'),
    panel: snoozePanel
  });

  nextWakeup(widget);
};

exports.onUnload = function () {
  if (wakeupId) {
    clearTimeout(wakeupId)
  }
};