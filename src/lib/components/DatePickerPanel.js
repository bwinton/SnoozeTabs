import React from 'react';

import moment from 'moment';
import classnames from 'classnames';

import Calendar from 'rc-calendar';
import TimePickerPanel from 'rc-time-picker/lib/Panel';

export default class DatePickerPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = { currentValue: props.defaultValue };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ currentValue: nextProps.defaultValue });
  }

  render() {
    const { id, header, active, onClose, onSelect } = this.props;
    const { currentValue } = this.state;
    const timePickerElement = <TimePickerPanel />;

    return (
      <div id={id} className={classnames('panel', { active })}>
        <div className="header">{header}</div>
        <Calendar showOk={false}
                  showDateInput={false}
                  value={currentValue}
                  timePicker={timePickerElement}
                  onSelect={value => this.handleTimeSelect(value)} />
        <div className="footer">
          <div className="back"
               onClick={onClose}><span>« Back</span></div>
          <div className="confirm snooze"
               onClick={() => onSelect(this.state.currentValue)}><span>Snooze!</span></div>
        </div>
      </div>
    );
  }

  handleTimeSelect(value) {
    this.setState({ currentValue: value });
  }
}
