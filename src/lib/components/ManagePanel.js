import React from 'react';

import moment from 'moment';

import classnames from 'classnames';

export default class ManagePanel extends React.Component {
  render() {
    const { id, entries, active, switchPanel } = this.props;
    return (
      <div id={id} className={classnames('panel', { active })}>
        <div className="header">Manage Snoozed Tabs</div>
        <ul className="entries">
          { entries.map((item, idx) => this.renderEntry(idx, item)) }
        </ul>
        <div className="footer">
          <div className="back" onClick={ ev => switchPanel('main') }><span>« Back</span></div>
        </div>
      </div>
    );
  }

  renderEntry(idx, item) {
    return (
      <li className="entry" key={idx}>
        <img src={item.icon || '../icons/nightly.svg'} className="icon" />
        <div className="content">
          <div className="title">{item.title || '&nbsp;'}</div>
          <div className="url">{item.url || '&nbsp;'}</div>
        </div>
        <div className="date">{moment(item.date).format('ddd, MMM D \ [@]ha') || 'Later'}</div>
      </li>
    );
  }
}
