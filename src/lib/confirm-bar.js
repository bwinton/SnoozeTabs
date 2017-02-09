/*
 * This Source Code is subject to the terms of the Mozilla Public License
 * version 2.0 (the 'License'). You can obtain a copy of the License at
 * http://mozilla.org/MPL/2.0/.
 */

'use strict';

// import moment from 'moment';
import { confirmationTime } from './times';

function sendShowUpdate(showCheckbox) {
  if (showCheckbox.checked) {
    browser.runtime.sendMessage({
      'op': 'setconfirm',
      'message': {dontShow: showCheckbox.checked}
    });
  }
}

chrome.runtime.onMessage.addListener(function({message, iconData, closeData}) {
  const atTime = confirmationTime(message.time, message.timeType);
  const confirmationId = 'snoozetabs-confirmation-bar';
  const okId = 'snoozetabs-ok';
  const cancelId = 'snoozetabs-cancel';
  const showId = 'snoozetabs-dontshow';
  const closeId = 'snoozetabs-close';

  let confirmationBar = document.getElementById(confirmationId);
  if (!confirmationBar) {
    confirmationBar = document.createElement('div');
    document.body.appendChild(confirmationBar);
  }
  confirmationBar.outerHTML = `<div id="${confirmationId}">
    <style scoped>
      * {
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
        min-height: 40px;
        margin: 0;
        position: fixed;
        top: -45px;
        transition: top 300ms ease-in-out;
        width: 100%;
        z-index: ${Number.MAX_SAFE_INTEGER};
      }
      #${confirmationId}.shown {
        top: 0;
      }
      img {
        height: 24px;
        width: 24px;
      }
      button {
        padding: 0;
        background-color: #fbfbfb;
        border: 1px solid #b1b1b1;
        font-family: Lucida Grande, Tahoma, sans-serif;
        font-size: 12px;
        height: 24px;
        width: 6em;
      }
      button:hover {
        background-color: #ebebeb;
      }
      button:active {
        background-color: #d4d4d4;
      }
      button.ok {
        border: 1px solid #258ad6;
        background-color: #0ba0f9;
        color: #fff;
      }
      button.ok:hover {
        background-color: #0670cc;
      }
      button.ok:active {
        background-color: #005bab;
      }
      input, label {
        color: #5d5d5d;
        font-size: 10px;
      }
      .spacer {
        flex: 1;
      }
      #${closeId} {
        cursor: pointer;
        height: 10px;
        margin-right: 16px;
        width: 10px;
      }
    </style>
    <img src="${iconData}" alt="tab icon">
    <span>This tab will snooze until ${atTime}.</span>
    <button class="ok" id="${okId}">OK</button>
    <button id="${cancelId}">Cancel</button>
    <div class="spacer"></div>
    <input type="checkbox" id="${showId}"/><label for="${showId}">Donʼt show this again</label>
    <img id="${closeId}" src="${closeData}" alt="close button">
  </div>`;

  confirmationBar = document.getElementById(confirmationId);
  const showCheckbox = document.getElementById(showId);

  window.setTimeout(() => {
    confirmationBar.classList.toggle('shown');
  }, 500);

  const okButton = document.getElementById(okId);
  okButton.addEventListener('click', () => {
    browser.runtime.sendMessage({
      'op': 'confirm',
      'message': message
    });
    sendShowUpdate(showCheckbox);
  });

  const cancelButton = document.getElementById(cancelId);
  cancelButton.addEventListener('click', () => {
    confirmationBar.classList.toggle('shown');
    sendShowUpdate(showCheckbox);
  });

  const closeButton = document.getElementById(closeId);
  closeButton.addEventListener('click', () => {
    confirmationBar.classList.toggle('shown');
    sendShowUpdate(showCheckbox);
  });

});
