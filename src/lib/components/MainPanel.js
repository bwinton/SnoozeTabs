import React from 'react';

import classnames from 'classnames';
import moment from 'moment';
import { times, timeForId } from '../times';

import DatePickerPanel from './DatePickerPanel';

export default class MainPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      datepickerActive: false,
      dateChoice: null
    };
  }

  render() {
    const { id, active, switchPanel } = this.props;
    const { datepickerActive } = this.state;

    return (
      <div>
        <div id={id} className={classnames('panel', { active })}>
          <div className="header"><img src="../icons/Bell Icon.svg" className="icon" />Snooze this tab until…</div>
          <ul className="times">
            { times.map(item => this.renderTime(item)) }
          </ul>
          <div className="footer">
            <div className="manage" onClick={ () => switchPanel('manage') }><span>Manage Snoozed Tabs</span></div>
          </div>
        </div>
        <DatePickerPanel id="calendar"
                         active={datepickerActive}
                         header="Pick a Date/Time"
                         defaultValue={moment()}
                         onClose={ () => this.closeTimeSelect() }
                         onSelect={ value => this.confirmTimeSelect(value) } />
      </div>
    );
  }

  renderTime(item) {
    let [, date] = timeForId(moment(), item.id);
    return (
      <li className="option" key={item.id} id={item.id} onClick={ ev => this.handleOptionClick(ev, item) }>
        <img src={ `../icons/${item.icon || 'nightly.svg'}` } className="icon" />
        <div className="title">{item.title || '&nbsp;'}</div>
        <div className="date">{date}</div>
      </li>
    );
  }

  handleOptionClick(ev, item) {
    const { scheduleSnoozedTab } = this.props;
    if (item.id === 'pick') {
      this.setState({ datepickerActive: true });
      return;
    }
    let [time, ] = timeForId(moment(), item.id);
    scheduleSnoozedTab(time);
  }

  closeTimeSelect() {
    this.setState({ datepickerActive: false });
  }

  confirmTimeSelect(dateChoice) {
    const { scheduleSnoozedTab } = this.props;
    if (!dateChoice) { return; }
    scheduleSnoozedTab(dateChoice);
  }
}
