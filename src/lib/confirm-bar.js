/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

// import moment from 'moment';
import { confirmationTime } from './times';

import { getLangDir } from './utils';
const langDir = getLangDir(browser.i18n.getUILanguage());

function sendShowUpdate(showCheckbox) {
  if (showCheckbox.checked) {
    browser.runtime.sendMessage({
      'op': 'setconfirm',
      'message': {dontShow: showCheckbox.checked}
    });
  }
}

function removeConfirmBar() {
  const el1 = document.getElementById('snoozetabs-confirm-bar');
  if (el1) { el1.remove(); }
  const el2 = document.getElementById('snoozetabs-confirm-bar-spacer');
  if (el2) { el2.remove(); }
}

chrome.runtime.onMessage.addListener(function({message, iconData, closeData}) {
  const atTime = confirmationTime(message.time, message.timeType);
  const confirmationId = 'snoozetabs-confirmation-bar';
  const okId = 'snoozetabs-ok';
  const cancelId = 'snoozetabs-cancel';
  const showId = 'snoozetabs-dontshow';
  const closeId = 'snoozetabs-close';
  const iconAltText = browser.i18n.getMessage('confirmIconAltText');
  const timeTitle = browser.i18n.getMessage('confirmTimeTitle', atTime);
  const okTitle = browser.i18n.getMessage('confirmOkButton');
  const cancelTitle = browser.i18n.getMessage('confirmCancelButton');
  const dontShowLabel = browser.i18n.getMessage('confirmDontShowLabel');
  const closeAltText = browser.i18n.getMessage('confirmCloseAltText');

  removeConfirmBar();

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'height: 45px; width: 100%; border: 0;';
  iframe.id = 'snoozetabs-confirm-bar-iframe';

  const frameDiv = document.createElement('div');
  frameDiv.id = 'snoozetabs-confirm-bar';
  frameDiv.style.cssText = 'height: 45px; width: 100%; top: 0; left: 0; padding: 0; position: fixed; z-index: 2147483647; visibility: visible;';
  frameDiv.appendChild(iframe);
  document.body.appendChild(frameDiv);

  const spacer = document.createElement('div');
  spacer.id = 'snoozetabs-confirm-bar-spacer';
  spacer.style.cssText = 'height: 45px;';
  document.body.insertBefore(spacer, document.body.firstChild);

  iframe.onload = () => {
    const iframeDocument = iframe.contentDocument;
    let confirmationBar = iframeDocument.createElement('div');
    confirmationBar.id = 'snoozetabs-confirmation-bar';
    iframeDocument.body.appendChild(confirmationBar);

    confirmationBar.outerHTML = `<div id="${confirmationId}" dir="${langDir}">
      <style>
        #${confirmationId} * {
          margin: 8px 0 8px 8px;
        }
        #${confirmationId} {
          -moz-user-select: none;
          align-items: center;
          background-color: #eee;
          box-shadow: 0 1px 0 0 rgba(0,0,0,0.35);
          color: #6a6a6a;
          display: flex;
          flex-direction: row;
          font-family: Lucida Grande, Tahoma, sans-serif;
          font-size: 14px;
          text-shadow: none;
          min-height: 40px;
          margin: 0;
          position: fixed;
          left: 0px;
          top: -45px;
          transition: top 300ms ease-in-out;
          width: 100%;
          z-index: ${Number.MAX_SAFE_INTEGER};
        }
        #${confirmationId}.shown {
          top: 0;
        }
        #${confirmationId} img {
          height: 24px;
          width: 24px;
        }
        #${confirmationId} button {
          padding: 0;
          background-color: #fbfbfb;
          border: 1px solid #b1b1b1;
          font-family: Lucida Grande, Tahoma, sans-serif;
          font-size: 12px;
          height: 24px;
          width: 6em;
        }
        #${confirmationId} button:hover {
          background-color: #ebebeb;
        }
        #${confirmationId} button:active {
          background-color: #d4d4d4;
        }
        #${confirmationId} button.ok {
          border: 1px solid #258ad6;
          background-color: #0ba0f9;
          color: #fff;
        }
        #${confirmationId} button.ok:hover {
          background-color: #0670cc;
        }
        #${confirmationId} button.ok:active {
          background-color: #005bab;
        }
        #${confirmationId} input, #${confirmationId} label {
          color: #5d5d5d;
          font-size: 10px;
        }
        #${confirmationId} label {
          margin-left: 3px;
        }
        #${confirmationId} .spacer {
          flex: 1;
        }
        #${confirmationId} #${closeId} {
          cursor: pointer;
          height: 10px;
          margin-right: 16px;
          width: 10px;
        }
      </style>
      <img src="${iconData}" alt="${iconAltText}">
      <span>${timeTitle}</span>
      <button class="ok" id="${okId}">${okTitle}</button>
      <button id="${cancelId}">${cancelTitle}</button>
      <div class="spacer"></div>
      <input type="checkbox" id="${showId}"/><label for="${showId}">${dontShowLabel}</label>
      <img id="${closeId}" src="${closeData}" alt="${closeAltText}">
    </div>`;

    confirmationBar = iframeDocument.getElementById(confirmationId);
    const showCheckbox = iframeDocument.getElementById(showId);

    window.setTimeout(() => {
      confirmationBar.classList.add('shown');
    }, 100);

    const okButton = iframeDocument.getElementById(okId);
    okButton.addEventListener('click', () => {
      browser.runtime.sendMessage({
        'op': 'confirm',
        'message': message
      });
      sendShowUpdate(showCheckbox);
    });

    const hideBar = () => {
      confirmationBar.classList.remove('shown');
      window.setTimeout(removeConfirmBar, 300);
      sendShowUpdate(showCheckbox);
    };

    const cancelButton = iframeDocument.getElementById(cancelId);
    cancelButton.addEventListener('click', hideBar);

    const closeButton = iframeDocument.getElementById(closeId);
    closeButton.addEventListener('click', hideBar);

  };

});
