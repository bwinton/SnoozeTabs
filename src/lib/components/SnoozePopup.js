import React from 'react';

import MainPanel from './MainPanel';
import ManagePanel from './ManagePanel';

export default class SnoozePopup extends React.Component {
  render() {
    const { entries, activePanel, switchPanel, scheduleSnoozedTab } = this.props;
    return (
      <div>
        <MainPanel id="main" active={'main' === activePanel}
                   switchPanel={switchPanel} scheduleSnoozedTab={scheduleSnoozedTab} />
        <ManagePanel id="manage" active={'manage' === activePanel}
                     entries={entries} switchPanel={switchPanel} />
      </div>
    );
  }
}
