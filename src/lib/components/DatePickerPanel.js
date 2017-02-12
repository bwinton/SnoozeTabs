import React from 'react';

import moment from 'moment';
import classnames from 'classnames';

import Calendar from 'rc-calendar';
import TimePicker from 'rc-time-picker';

// Arbitrary 0.5s interval for live validation of time selection
const VALIDATION_INTERVAL = 500;

export default class DatePickerPanel extends React.Component {
  constructor(props) {
    super(props);
    this.validationTimer = null;
    this.state = {
      currentValue: props.defaultValue,
      confirmDisabled: false
    };
  }

  componentDidMount() {
    this.validationTimer = setInterval(this.validateOnTimeChange.bind(this),
                                       VALIDATION_INTERVAL);
  }

  componentWillUnmount() {
    clearInterval(this.validationTimer);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ currentValue: nextProps.defaultValue });
  }

  render() {
    const { id, header, active, onClose } = this.props;
    const { currentValue, confirmDisabled } = this.state;
    const disabledTimeFns = this.disabledTime();

    return (
      <div id={id} className={classnames('panel', { active })}>
        <div className="header">{header}</div>
        <Calendar showOk={false}
                  showDateInput={false}
                  showToday={false}
                  value={currentValue}
                  disabledDate={this.disabledDate.bind(this)}
                  disabledTime={this.disabledTime.bind(this)}
                  onChange={value => this.handleChange(value)}
                  onSelect={value => this.handleChange(value)} />
        <div className="time-wrapper">
          <TimePicker showSecond={false}
                      hideDisabledOptions={true}
                      allowEmpty={false}
                      value={currentValue}
                      format="h:mm a"
                      onChange={value => this.handleChange(value)}
                      {...disabledTimeFns} />
        </div>
        <div className="footer">
          <div className="back"
            onClick={onClose}><span>{browser.i18n.getMessage('datePickerBack')}</span></div>
          <div className={classnames('confirm', 'snooze', { disabled: confirmDisabled })}
               title={confirmDisabled ? browser.i18n.getMessage('datePickerDisabled') : ''}
               onClick={() => this.handleConfirm()}><span>{
                 browser.i18n.getMessage('datePickerSnooze')
               }</span></div>
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

  validateOnTimeChange() {
    const { currentValue, confirmDisabled } = this.state;
    const newConfirmDisabled = (currentValue.valueOf() <= Date.now());
    if (confirmDisabled !== newConfirmDisabled) {
      this.setState({ confirmDisabled: newConfirmDisabled });
    }
  }

  handleConfirm() {
    const { onSelect } = this.props;
    const { currentValue } = this.state;

    if (currentValue.valueOf() > Date.now()) {
      onSelect(currentValue);
    }
  }
}
