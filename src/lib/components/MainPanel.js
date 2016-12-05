import React from 'react';

import classnames from 'classnames';
import moment from 'moment';
import { times, timeForId } from '../times';

import Calendar from 'rc-calendar';
import TimePickerPanel from 'rc-time-picker/lib/Panel';

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
    const timePickerElement = <TimePickerPanel />;

    return (
      <div>
        <div id={id} className={classnames('panel', { active })}>
          <div className="header"><img src="../icons/Bell Icon.svg" className="icon" />Snooze this tab until…</div>
          <ul className="times">
            { times.map(item => this.renderTime(item)) }
          </ul>
          <div className="footer manage" onClick={ ev => switchPanel('manage') }>Manage Snoozed Tabs</div>
        </div>
        <div id="calendar" className={classnames('panel', { active: datepickerActive })}>
          <div className="header">Pick a Date/Time</div>
          <Calendar showOk={false} showDateInput={false}
                    timePicker={timePickerElement} onSelect={ value => this.handleTimeSelect(value) } />
          <div className="footer">
            <div className="back" onClick={ ev => this.closeTimeSelect() }><span>« Back</span></div>
              <div className="confirm snooze" onClick={ ev => this.confirmTimeSelect() }><span>Snooze!</span></div>
          </div>
        </div>
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

  handleTimeSelect(value) {
    this.setState({ dateChoice: value });
  }

  closeTimeSelect() {
    this.setState({ datepickerActive: false });
  }

  confirmTimeSelect() {
    const { dateChoice } = this.state;
    const { scheduleSnoozedTab } = this.props;

    if (!dateChoice) { return; }
    scheduleSnoozedTab(dateChoice);
  }
}
