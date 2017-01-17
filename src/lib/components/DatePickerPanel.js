import React from 'react';

import moment from 'moment';
import classnames from 'classnames';

import Calendar from 'rc-calendar';
import TimePickerPanel from 'rc-time-picker/lib/Panel';

export default class DatePickerPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentValue: props.defaultValue,
      confirmDisabled: false
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ currentValue: nextProps.defaultValue });
  }

  render() {
    const { id, header, active, onClose } = this.props;
    const { currentValue, confirmDisabled } = this.state;

    return (
      <div id={id} className={classnames('panel', { active })}>
        <div className="header">{header}</div>
        <Calendar showOk={false}
                  showDateInput={false}
                  value={currentValue}
                  timePicker={(
                    <TimePickerPanel value={currentValue}
                      showHour={true} showMinute={true} showSecond={true} />
                  )}
                  disabledDate={this.disabledDate.bind(this)}
                  disabledTime={this.disabledTime.bind(this)}
                  onChange={value => this.handleChange(value)}
                  onSelect={value => this.handleChange(value)} />
        <div className="footer">
          <div className="back"
               onClick={onClose}><span>« Back</span></div>
          <div className={classnames('confirm', 'snooze', { disabled: confirmDisabled })}
               title={confirmDisabled ? 'Time selection is in the past' : ''}
               onClick={() => this.handleConfirm()}><span>Snooze!</span></div>
        </div>
      </div>
    );
  }

  disabledDate(current) {
    if (!current) { return false; }
    const today = moment().hour(0).minute(0).second(0);
    return current.valueOf() < today.valueOf();
  }

  makeRangeArray(start, end) {
    const out = [];
    for (let idx = start; idx < end; idx++) {
      out.push(idx);
    }
    return out;
  }

  disabledTime() {
    const { currentValue } = this.state;
    if (!currentValue) { return; }

    // All time selection disabled for past dates
    const today = moment().hour(0).minute(0).second(0);
    if (currentValue.valueOf() < today.valueOf()) {
      return {
        disabledHours: () => this.makeRangeArray(0, 24),
        disabledMinutes: () => this.makeRangeArray(0, 60),
        disabledSeconds: () => this.makeRangeArray(0, 60)
      };
    }

    // Disable past times for today as appropriate
    const now = moment();
    if (now.date() === currentValue.date() &&
        now.month() === currentValue.month() &&
        now.year() === currentValue.year()) {
      return {
        disabledHours: () =>
          this.makeRangeArray(0, now.hour()),
        disabledMinutes: () =>
          now.hour() === currentValue.hour() ?
            this.makeRangeArray(0, now.minute()) : [],
        disabledSeconds: () =>
          now.hour() === currentValue.hour() &&
          now.minute() === currentValue.minute() ?
            this.makeRangeArray(0, now.second()) : []
      };
    }
  }

  handleChange(value) {
    this.setState({
      currentValue: value,
      confirmDisabled: (value.valueOf() <= Date.now())
    });
  }

  handleConfirm() {
    const { onSelect } = this.props;
    const { currentValue } = this.state;

    if (currentValue.valueOf() > Date.now()) {
      onSelect(currentValue);
    }
  }
}
