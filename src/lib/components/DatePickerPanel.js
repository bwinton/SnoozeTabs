import React from 'react';

import classnames from 'classnames';

import 'moment/min/locales.min';
import Calendar from 'rc-calendar';
import TimePicker from 'rc-time-picker';
import { use12hFormat } from '../time-formats.js';

import cs_CZ from 'rc-calendar/lib/locale/cs_CZ';
import da_DK from 'rc-calendar/lib/locale/da_DK';
import de_DE from 'rc-calendar/lib/locale/de_DE';
import en_US from 'rc-calendar/lib/locale/en_US';
import ja_JP from 'rc-calendar/lib/locale/ja_JP';
import pl_PL from 'rc-calendar/lib/locale/pl_PL';
import pt_BR from 'rc-calendar/lib/locale/pt_BR';
import ru_RU from 'rc-calendar/lib/locale/ru_RU';
import zh_CN from 'rc-calendar/lib/locale/zh_CN';

const uiLanguage = browser.i18n.getUILanguage();
const momentLocale = uiLanguage.replace('_', '-');
const rcCalendarLocales = { cs_CZ, da_DK, de_DE, en_US, ja_JP, pl_PL, pt_BR, ru_RU, zh_CN };
const rcCalendarLocale = (uiLanguage in rcCalendarLocales) ? rcCalendarLocales[uiLanguage] : {};
const localeKeys = [
  'today', 'now', 'backToToday', 'ok', 'clear', 'month', 'year', 'timeSelect',
  'dateSelect', 'monthSelect', 'yearSelect', 'decadeSelect', 'yearFormat',
  'dateFormat', 'dayFormat', 'dateTimeFormat', 'monthFormat',
  'monthBeforeYear', 'previousMonth', 'nextMonth', 'previousYear', 'nextYear',
  'previousDecade', 'nextDecade', 'previousCentury', 'nextCentury'
];

// Assemble calendarLocale from a combination of strings supplied by
// rc-calendar and by Pontoon localizers, which ever seems better.
const calendarLocale = {};
localeKeys.forEach(key => {
  const defaultString = rcCalendarLocales.en_US[key];
  const rcCalendarString = rcCalendarLocale[key];
  const localString = browser.i18n.getMessage(`calendar_${key}`);

  let val;
  if (localString === defaultString && rcCalendarString && rcCalendarString !== defaultString) {
    // If the locally translated string is the same as the default, it's
    // possibly a fallback. If we have a string from rc-calendar that is not
    // also the default, let's use it.
    val = rcCalendarString;
  } else if (localString) {
    // Otherwise, use the localString if it's not empty
    val = localString;
  } else {
    // Finally fall back to default.
    val = defaultString;
  }
  calendarLocale[key] = val;
});

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

    const currentValueLocalized = currentValue.clone().locale(momentLocale);

    const timeFormat = use12hFormat ? 'h:mm a' : 'HH:mm';

    return (
      <div id={id} className={classnames('panel', { active })}>
        <div className="header">{header}</div>
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

  handleConfirm() {
    const { onSelect } = this.props;
    const { currentValue } = this.state;

    if (currentValue.valueOf() > Date.now()) {
      onSelect(currentValue);
    }
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
