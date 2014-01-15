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
var {data, id, name} = require('sdk/self');
var {Panel} = require('sdk/panel');
var prefs = require('sdk/simple-prefs');
// var micropilot = require('./micropilot');
var notifications = require('sdk/notifications');
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
var showWidgetPanel = function (widget) {
  var wm = chrome.Cc["@mozilla.org/appshell/window-mediator;1"]
                     .getService(chrome.Ci.nsIWindowMediator);
  var win = wm.getMostRecentWindow("navigator:browser");
  var widgetElem = win.document.getElementById("widget:" + id + "-" + widget.id);
  widget.panel.show(null, widgetElem);
};


var wakeupId;
var nextWakeup = function (widget, bookmark) {
  // Do something with the bookmark.
  if (bookmark) {
    var tabExists = false;
    for each (var tab in tabs) {
      if (tab.url === bookmark.url) {
        tabExists = true;
        break;
      }
    }
    if (!tabExists) {
      tabs.open({url: bookmark.url, inBackground: true});
    }

    notifications.notify({
      title: "SnoozeTabs",
      text: bookmark.title,
      iconURL: snooze.getThumbnail(bookmark) || data.url("PanelHeader@2x.png"),
      data: bookmark.url,
      onClick: function (data) {
        for each (var tab in tabs) {
          if (tab.url === data) {
            tab.activate();
            return;
          }
        }
        tabs.open({url: data});
      }
    });
    snooze.opened(bookmark);
  }

  // And snooze until it's time to wake up next.
  snooze.getNextWakeup().then(function (result) {
    wakeupId = setTimeout(nextWakeup, result.timeout, widget, result.bookmark);
  });
}

var snoozePanel = Panel({
  width: 240,
  height: 350,
  contentURL: data.url('snoozePanel.html'),
  contentScriptFile: data.url('content-script.js'),
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

    // Reset the amount of time we should wait,
    // because the new value may be less than the old one.
    if (wakeupId) {
      clearTimeout(wakeupId);
    }
    nextWakeup(widget);
  });
});

var widget = Widget({
  id: 'snoozetabs-btn',
  label: 'Snooze',
  content: makeContent('SnoozeTabsButtonGrey.png'),
  panel: snoozePanel
});


exports.main = function () {
  nextWakeup(widget);
};

exports.onUnload = function () {
  if (wakeupId) {
    clearTimeout(wakeupId);
  }
};