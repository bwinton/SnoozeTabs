 /*
  * This Source Code is subject to the terms of the Mozilla Public License
  * version 2.0 (the 'License'). You can obtain a copy of the License at
  * http://mozilla.org/MPL/2.0/.
  */

'use strict';

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
}

browser.runtime.onMessage.addListener(function({message, confirmIconData, closeData}) {
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

  const bar = document.createElement('div');
  bar.id = confirmationId;
  bar.dir = langDir;
  bar.innerHTML = `
    <style>
      #${confirmationId} {
        -moz-user-select: none;
        align-items: center;
        background-color: #eee;
        box-shadow: 0 0 4px rgba(0,0,0,0.35);
        color: #0c0c0d;
        display: flex;
        flex-direction: row;
        font: message-box;
        font-family: Lucida Grande, Tahoma, sans-serif;
        font-size: 13px;
        text-shadow: none;
        min-height: 40px;
        margin: 0;
        position: fixed;
        left: 0px;
        top: -45px;
        transition: top 150ms ease-out;
        width: 100%;
        z-index: 2147483647;
      }
      #${confirmationId}.shown {
        top: 0;
      }
      #${confirmationId} img {
        height: 24px;
        width: 24px;
        margin: 8px 0 8px 8px;
      }
      #${confirmationId} button {
        border: none;
        padding: 0;
        cursor: pointer;
        background-color: rgba(12,12,13,0.1);
        font-family: Lucida Grande, Tahoma, sans-serif;
        font-size: 13px;
        height: 32px;
        width: 6em;
        margin: 8px 0 8px 8px;
      }
      #${confirmationId} button:hover,
      #${confirmationId} button:focus {
        background-color: rgba(12,12,13,0.2);
      }
      #${confirmationId} button:active {
        background-color: rgba(12,12,13,0.3);
      }
      #${confirmationId} button.ok {
        background-color: #0060df;
        color: #fff;
        margin-left: 8px;
      }
      #${confirmationId} button.ok:hover,
      #${confirmationId} button.ok:focus {
        background-color: #003eaa;
      }
      #${confirmationId} button.ok:active {
        background-color: #002275;
      }
      #${confirmationId} input, #${confirmationId} label {
        font-size: 11px;
        margin: 8px 0 8px 8px;
      }
      #${confirmationId} .spacer {
        flex: 1;
      }
      #${closeId} {
        cursor: pointer;
        height: 16px;
        width: 16px;
        margin: 8px 8px 8px 0;
      }
    </style>
    <img src="${confirmIconData}" alt="${iconAltText}">
    <span>${timeTitle}</span>
    <button class="ok" id="${okId}">${okTitle}</button>
    <button id="${cancelId}">${cancelTitle}</button>
    <div class="spacer"></div>
    <input type="checkbox" id="${showId}"/>
    <label for="${showId}">${dontShowLabel}</label>
    <img id="${closeId}" src="${closeData}" alt="${closeAltText}">
  `;

  document.body.appendChild(bar);

  const showCheckbox = bar.querySelector(`#${showId}`);
  const okButton = bar.querySelector(`#${okId}`);
  const cancelButton = bar.querySelector(`#${cancelId}`);
  const closeButton = bar.querySelector(`#${closeId}`);

  requestAnimationFrame(() => {
    bar.classList.add('shown');
  });

  okButton.addEventListener('click', () => {
    browser.runtime.sendMessage({
      'op': 'confirm',
      'message': message
    });
    sendShowUpdate(showCheckbox);
  });

  const hideBar = () => {
    bar.classList.remove('shown');
    setTimeout(removeConfirmBar, 300);
    sendShowUpdate(showCheckbox);
  };

  cancelButton.addEventListener('click', hideBar);
  closeButton.addEventListener('click', hideBar);

});
