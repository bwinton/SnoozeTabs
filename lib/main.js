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
var {ToggleButton} = require('sdk/ui/button/toggle');
var core = require('sdk/view/core');


const STUDY_ID = 'snoozetabs';
const UPLOAD_URL = 'https://snoozetabs.paas.allizom.org/data/' + STUDY_ID;


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
    widget.icon = colourIcon;
  },
  onHide: function () {
    widget.icon = greyIcon;
    widget.state('window', {checked: false});
  }
});

snoozePanel.port.on("chromeEvent", function (e) {

  if (e.kind === 'buttonClicked') {
    snooze.handleEvent(e.data).then(function (url) {
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
    }, function (error) {
      console.log(error);
    });
  } else if (e.kind === 'manageClicked') {
    snooze.getSnoozedGroup().then(function (group) {
      var wm = chrome.Cc["@mozilla.org/appshell/window-mediator;1"]
                         .getService(chrome.Ci.nsIWindowMediator);
      var win = wm.getMostRecentWindow("navigator:browser");
      win.PlacesCommandHook.showPlacesOrganizer(group.id);
    });
  } else {
    console.log('Unknown message of', e.kind, e.data);
  }
});

var greyIcon = {
  '18': data.url('Snooze18_Grey.png'),
  '32': data.url('Snooze32_Grey.png'),
  '36': data.url('Snooze36_Grey.png'),
  '64': data.url('Snooze64_Grey.png'),
  '96': data.url('Snooze96_Grey.png'),
  '128': data.url('Snooze128_Grey.png')
};
var colourIcon = {
  '18': data.url('Snooze18.png'),
  '32': data.url('Snooze32.png'),
  '36': data.url('Snooze36.png'),
  '64': data.url('Snooze64.png'),
  '96': data.url('Snooze96.png'),
  '128': data.url('Snooze128.png')
};

var widget = ToggleButton({
  id: 'snoozetabs-btn',
  label: 'Snooze',
  icon: greyIcon,
  onChange: function (state) {
    if (state.checked) {
      snoozePanel.show({
        position: widget
      });
    }
  }
});

core.viewFor(widget).setAttribute('constrain-size', 'true');

exports.main = function () {
  nextWakeup(widget);
};

exports.onUnload = function () {
  if (wakeupId) {
    clearTimeout(wakeupId);
  }
};