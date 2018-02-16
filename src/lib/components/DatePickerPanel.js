import React from 'react';

import classnames from 'classnames';

import 'moment/min/locales.min';
import Calendar from 'rc-calendar';
import TimePicker from 'rc-time-picker';
import { getLocalizedDateTime, use12hFormat } from '../time-formats.js';

import en_US from 'rc-calendar/lib/locale/en_US';

const uiLanguage = browser.i18n.getUILanguage();
const momentLocale = uiLanguage.replace('_', '-');

// Set up functional formatters using IntlDateTimeFormat API
const makeFormatter = type => time => getLocalizedDateTime(time, type);
const calendarLocale = {
  yearFormat: makeFormatter('year'),
  dateFormat: makeFormatter('date'),
  dayFormat:  makeFormatter('day'),
  dateTimeFormat: makeFormatter('dateTime'),
  monthFormat: makeFormatter('month'),
};

// HACK: This is kind of ugly, but rc-calendar doesn't use an easily patchable
// formatter for the month & year in the header of the calendar control [1][2]
// [1] https://github.com/react-component/calendar/blob/354fb3cfb7501cba1dbc607271abceb33deb72c6/src/calendar/CalendarHeader.jsx#L89
// [2] https://github.com/react-component/calendar/blob/354fb3cfb7501cba1dbc607271abceb33deb72c6/src/calendar/CalendarHeader.jsx#L117
calendarLocale.monthBeforeYear = new Intl.DateTimeFormat(
  [uiLanguage.replace('_', '-'), 'en-US'],
  {month: 'numeric', year: 'numeric'}
).formatToParts()[0].type === 'month';

// Assemble a locale for rc-calendar from the extension's strings, with the
// en_US locale from rc-calendar as a fallback
const localeKeys = [
  'today', 'now', 'backToToday', 'ok', 'clear', 'month', 'year', 'timeSelect',
  'dateSelect', 'monthSelect', 'yearSelect', 'decadeSelect',
  'monthBeforeYear', 'previousMonth', 'nextMonth', 'previousYear', 'nextYear',
  'previousDecade', 'nextDecade', 'previousCentury', 'nextCentury'
];
localeKeys.forEach(key =>
  calendarLocale[key] = browser.i18n.getMessage(`calendar_${key}`) || en_US[key]);

// Arbitrary 0.5s interval for live validation of time selection
const VALIDATION_INTERVAL = 500;

export default class DatePickerPanel extends React.Component {
  constructor(props) {
    super(props);
    this.validationTimer = null;
    this.state = {
      currentValue: props.defaultValue || props.moment(),
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

    // Clone & patch the moment value to accept functions as formats
    const currentValueLocalized = currentValue.clone().locale(momentLocale);
    const origFormat = currentValueLocalized.format;
    currentValueLocalized.format = format => (typeof format === 'function') ?
      format(currentValueLocalized) : origFormat.call(currentValueLocalized, format);

    const timeFormat = use12hFormat ? 'h:mm a' : 'HH:mm';

    return (
      <div id={id} className={classnames('panel', { active })}>
        <h1 className="header">{header}</h1>
        <Calendar locale={calendarLocale}
                  showOk={false}
                  showDateInput={false}
                  showToday={false}
                  value={currentValueLocalized}
                  disabledDate={this.disabledDate.bind(this)}
                  disabledTime={this.disabledTime.bind(this)}
                  onChange={value => this.handleChange(value)}
                  onSelect={value => this.handleChange(value)} />
        <div className="time-wrapper">
          <TimePicker locale={calendarLocale}
                      showSecond={false}
                      hideDisabledOptions={true}
                      allowEmpty={false}
                      value={currentValueLocalized}
                      format={timeFormat}
                      onChange={value => this.handleChange(value)}
                      {...disabledTimeFns} />
        </div>
        <div className="footer" role="menu">
          <div className="back" tabIndex={1}
            onClick={onClose} onKeyPress={onClose}><span>{browser.i18n.getMessage('datePickerBack')}</span></div>
          <div className={classnames('confirm', 'snooze', { disabled: confirmDisabled })}
               title={confirmDisabled ? browser.i18n.getMessage('datePickerDisabled') : ''}
               tabIndex={confirmDisabled? -1: 1}
               onClick={ev => this.handleConfirm(ev)}
               onKeyPress={ev => this.handleConfirm(ev)}><span>{
                 browser.i18n.getMessage('datePickerSnooze')
               }</span></div>
        </div>
      </div>
    );
  }

  disabledDate(current) {
    if (!current) { return false; }
    const today = this.props.moment().hour(0).minute(0).second(0);
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
    const today = this.props.moment().hour(0).minute(0).second(0);
    if (currentValue.valueOf() < today.valueOf()) {
      return {
        disabledHours: () => this.makeRangeArray(0, 24),
        disabledMinutes: () => this.makeRangeArray(0, 60),
        disabledSeconds: () => this.makeRangeArray(0, 60)
      };
    }

    // Disable past times for today as appropriate
    const now = this.props.moment();
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

  handleConfirm(ev) {
    const { onSelect } = this.props;
    const { currentValue } = this.state;
    if (ev.key && ev.key !== 'Enter') { return; }
    if (currentValue.valueOf() > Date.now()) {
      onSelect(currentValue);
    }
  }

  handleKeyClose(ev) {
    if (ev.key !== 'Enter') { return; }
    this.props.onClose();
  }
}

DatePickerPanel.propTypes = {
  active: React.PropTypes.bool.isRequired,
  defaultValue: React.PropTypes.object.isRequired,
  header: React.PropTypes.string.isRequired,
  id: React.PropTypes.string.isRequired,
  moment: React.PropTypes.func.isRequired,
  onClose: React.PropTypes.func.isRequired,
  onSelect: React.PropTypes.func.isRequired,
};
