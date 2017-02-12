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
    const { id, entries, active, tabIsSnoozable, dontShow, updateDontShow } = this.props;
    const { datepickerActive } = this.state;

    const sortedEntries = [...entries];
    sortedEntries.sort((a, b) => {
      if (a.time === NEXT_OPEN) {
        if (b.time === NEXT_OPEN) {
          return a.title.localeCompare(b.title);
        } else {
          return -1;
        }
      } else if (b.time === NEXT_OPEN) {
        return 1;
      } else {
        return a.time - b.time;
      }
    });

    return (
      <div>
        <div id={id} className={classnames('panel', { active, obscured: datepickerActive, static: !tabIsSnoozable })}>
          <div className="header">{browser.i18n.getMessage('manageHeader')}</div>
          { (sortedEntries.length > 0) ? (
            <ul className={classnames('entries', { 'big': !tabIsSnoozable })}>
              { sortedEntries.map((item, idx) => this.renderEntry(idx, item)) }
            </ul>
          ) : (
            <div className="empty-entries">
              <div className="icon">
                <img src="../icons/bell_icon.svg" width="64" height="64" />
              </div>
              <div className="message">{browser.i18n.getMessage('manageNoSnoozes')}</div>
            </div>
          )}
          <div className="confirm">
            <input type="checkbox" id="confirm-checkbox" checked={!dontShow}
              onChange={event => updateDontShow(!event.target.checked)}/>
            <label htmlFor="confirm-checkbox">{browser.i18n.getMessage('manageConfirmLabel')}</label>
          </div>
          <div className={classnames('footer', { 'hide': !tabIsSnoozable })}>
            <div className="back" onClick={() => this.handleBack()}><span>{
              browser.i18n.getMessage('manageBack')
            }</span></div>
          </div>
        </div>
        <DatePickerPanel id="manageCalendar"
                         active={datepickerActive}
                         header={browser.i18n.getMessage('manageCalendarHeader')}
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
    const parser = document.createElement('a');
    parser.href = url;
    if (parser.protocol.startsWith('http')) {
      return parser.host.replace(/^www\./, '');
    }
    return url;
  }

  getDate(time) {
    if (time === NEXT_OPEN) {
      return browser.i18n.getMessage('manageDateNext');
    }
    if (moment(time).year() !== moment().year()) {
      return moment(time).format('MMM D, YYYY') || browser.i18n.getMessage('manageDateLater');
    }
    return moment(time).format('ddd, MMM D') || browser.i18n.getMessage('manageDateLater');
  }

  getTime(time) {
    if (time === NEXT_OPEN) {
      return browser.i18n.getMessage('manageTimeNext');
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
    const url = this.getDisplayUrl(item.url);
    return (
      <li className="entry" key={idx}>
        <div className="icon">
          <img src={item.icon || '../icons/nightly.svg'} />
        </div>
        <div className="content" onClick={() => this.handleItemClick(item)}>
          <div className="title" title={item.title}>{item.title || '&nbsp;'}</div>
          <div className="url" title={item.url}>{url}</div>
        </div>
        <div className={classnames('date', {'editable': this.getEditable(item.time) })} onClick={() => this.handleEntryEdit(item)}>
          <span>{this.getDate(item.time)}</span>
          <span>{this.getTime(item.time)}</span>
        </div>
        <div className="delete" onClick={() => this.handleItemDelete(item)}>
          <img src="../icons/trash.svg" width="16" height="16" />
        </div>
      </li>
    );
  }

  shouldIgnoreClicks() {
    const { active } = this.props;
    const { datepickerActive } = this.state;
    return !active || datepickerActive;
  }

  handleBack() {
    if (this.shouldIgnoreClicks()) { return; }
    const { switchPanel } = this.props;
    switchPanel('main');
  }

  handleItemClick(item) {
    if (this.shouldIgnoreClicks()) { return; }
    const { openSnoozedTab } = this.props;
    openSnoozedTab(item);
  }

  handleItemDelete(item) {
    if (this.shouldIgnoreClicks()) { return; }
    const { cancelSnoozedTab } = this.props;
    cancelSnoozedTab(item);
  }

  handleEntryEdit(item) {
    if (this.shouldIgnoreClicks()) { return; }
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
