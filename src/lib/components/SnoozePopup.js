import React from 'react';

import MainPanel from './MainPanel';
import ManagePanel from './ManagePanel';

export default class SnoozePopup extends React.Component {
  render() {
    const { activePanel } = this.props;
    return (
      <div>
        <MainPanel {...this.props} id="main" active={'main' === activePanel} />
        <ManagePanel {...this.props} id="manage" active={'manage' === activePanel} />
      </div>
    );
  }
}
