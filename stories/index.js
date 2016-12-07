import React from 'react';
import { storiesOf, action, linkTo } from '@kadira/storybook';
import { host } from 'storybook-host';

import SnoozePopup from '../src/lib/components/SnoozePopup';
import MainPanel from '../src/lib/components/MainPanel';
import ManagePanel from '../src/lib/components/ManagePanel';

import '../dist/popup/snooze.css';
// import '../src/popup/snooze.scss';

const popupHost = host({ width: 250, height: 367 });

storiesOf('SnoozePopup', module)
  .addDecorator(popupHost)
  .add('main', () => (
    <SnoozePopup
      {...{ activePanel: 'main', entries: [] }}
      switchPanel={name => linkTo('SnoozePopup', name)()}
      scheduleSnoozedTab={action('scheduleSnoozedTab')} />
  ))
  .add('manage', () => (
    <SnoozePopup
      {...{
        activePanel: 'manage',
        entries: [
         { title: 'foo', url: 'http://qz.com', date: Date.now() }
        ]
      }}
      switchPanel={name => linkTo('SnoozePopup', name)()}
      scheduleSnoozedTab={action('scheduleSnoozedTab')} />
  ))
