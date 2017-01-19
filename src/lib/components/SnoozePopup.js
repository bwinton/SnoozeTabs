import React from 'react';

import classnames from 'classnames';

import MainPanel from './MainPanel';
import ManagePanel from './ManagePanel';

export default class SnoozePopup extends React.Component {
  render() {
    const { activePanel, tabIsSnoozable, narrowPopup } = this.props;
    return (
      <div className={classnames('panel-wrapper', { 'popup-narrow': narrowPopup })}>
        {tabIsSnoozable && <MainPanel {...this.props} id="main" active={'main' === activePanel} />}
        <ManagePanel {...this.props} id="manage" active={'manage' === activePanel} />
      </div>
    );
  }
}
