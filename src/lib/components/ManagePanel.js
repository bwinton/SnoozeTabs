import React from 'react';

import moment from 'moment';
import classnames from 'classnames';
import { NEXT_OPEN } from '../times';

import DatePickerPanel from './DatePickerPanel';

export default class ManagePanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      datepickerActive: false,
      editedItem: null,
      dateChoice: moment()
    };
  }

  render() {
    const { id, entries, active, switchPanel } = this.props;
    const { datepickerActive } = this.state;

    const sortedEntries = [...entries];
    sortedEntries.sort((a, b) => a.time - b.time);

    return (
      <div>
        <div id={id} className={classnames('panel', { active })}>
          <div className="header">Manage Snoozed Tabs</div>
          <ul className="entries">
            { sortedEntries.map((item, idx) => this.renderEntry(idx, item)) }
          </ul>
          <div className="footer">
            <div className="back" onClick={ () => switchPanel('main') }><span>« Back</span></div>
          </div>
        </div>
        <DatePickerPanel id="manageCalendar"
                         active={datepickerActive}
                         header="Edit Date/Time"
                         defaultValue={this.state.dateChoice}
                         onClose={ () => this.closeTimeSelect() }
                         onSelect={ value => this.confirmTimeSelect(value) } />
      </div>
    );
  }

  getDisplayUrl(url) {
    if (!url) {
      return '&nbsp;';
    }
    var parser = document.createElement('a');
    parser.href = url;
    if (parser.protocol.startsWith('http')) {
      return parser.host.replace(/^www\./, '');
    }
    return url;
  }

  getDate(time) {
    if (time === NEXT_OPEN) {
      return 'Next time';
    }
    return moment(time).format('ddd, MMM D') || 'Later'
  }

  getTime(time) {
    if (time === NEXT_OPEN) {
      return 'Firefox opens';
    }
    return moment(time).format('[@] ha') || '';
  }

  getEditable(time) {
    if (time === NEXT_OPEN) {
      return false;
    }
    return true;
  }

  renderEntry(idx, item) {
    const { openSnoozedTab, cancelSnoozedTab } = this.props;
    const url = this.getDisplayUrl(item.url);
    return (
      <li className="entry" key={idx}>
        <div className="icon">
          <img src={item.icon || '../icons/nightly.svg'} />
        </div>
        <div className="content" onClick={() => openSnoozedTab(item)}>
          <div className="title" title={item.title}>{item.title || '&nbsp;'}</div>
          <div className="url" title={item.url}>{url}</div>
        </div>
        <div className={classnames('date', {'editable': this.getEditable(item.time) })} onClick={() => this.handleEntryEdit(item)}>
          <span>{this.getDate(item.time)}</span>
          <span>{this.getTime(item.time)}</span>
        </div>
        <div className="delete" onClick={() => cancelSnoozedTab(item)}>
          <img src="../icons/Trash.svg" width="16" height="16" />
        </div>
      </li>
    );
  }

  handleEntryEdit(item) {
    if (!this.getEditable(item.time)) {
      // Just open the tab if we can't edit it.
      this.props.openSnoozedTab(item);
      return;
    }
    this.setState({
      datepickerActive: true,
      editedItem: item,
      dateChoice: moment(item.time)
    });
  }

  handleTimeSelect(value) {
    this.setState({ dateChoice: value });
  }

  closeTimeSelect() {
    this.setState({ datepickerActive: false });
  }

  confirmTimeSelect(dateChoice) {
    const { editedItem } = this.state;
    const { updateSnoozedTab } = this.props;

    if (!dateChoice) { return; }

    updateSnoozedTab(
      editedItem,
      { ...editedItem, time: dateChoice.valueOf() }
    );
    this.setState({
      datepickerActive: false,
      editedItem: null
    });
  }

}
