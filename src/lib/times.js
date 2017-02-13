/* exported timeForId */

import { makeLogger } from './utils';
const log = makeLogger('TI');

import moment from 'moment';
import 'moment/min/locales.min';
browser.i18n.getAcceptLanguages().then(languages => {
  moment.locale(languages);
}).catch(reason => {
  log('getAcceptLanguages rejected', reason);
});

const NEXT_OPEN = 'next';
const PICK_TIME = 'pick';
export {NEXT_OPEN, PICK_TIME};

export const times = [
  {id: 'later', icon: 'later_today.svg', title: browser.i18n.getMessage('timeLaterToday')},
  {id: 'tomorrow', icon: 'tomorrow.svg', title: browser.i18n.getMessage('timeTomorrow')},
  {id: 'weekend', icon: 'weekends.svg', title: browser.i18n.getMessage('timeThisWeekend')},
  {id: 'week', icon: 'next_week.svg', title: browser.i18n.getMessage('timeNextWeek')},
  {id: 'month', icon: 'next_month.svg', title: browser.i18n.getMessage('timeNextMonth')},
  {id: NEXT_OPEN, icon: 'next_open.svg', title: browser.i18n.getMessage('timeNextOpen')},
  {id: PICK_TIME, icon: 'pick_date.svg', title: browser.i18n.getMessage('timePickADate')},
];

if (process.env.NODE_ENV === 'development') {
  times.unshift({ id: 'debug', icon: 'nightly.svg', title: browser.i18n.getMessage('timeRealSoonNow')});
}

export function timeForId(time, id) {
  let rv = moment(time);
  let text = rv.fromNow();
  switch (id) {
    case 'debug':
      rv = rv.add(5, 'seconds');
      text = rv.format('[@] ha');
      break;
    case 'later':
      rv = rv.add(3, 'hours').minute(0);
      text = rv.format('[@] ha');
      break;
    case 'tomorrow':
      rv = rv.add(1, 'day').hour(9).minute(0);
      text = rv.format('ddd [@] ha');
      break;
    case 'weekend':
      rv = rv.day(6).hour(9).minute(0);
      text = rv.format('ddd [@] ha');
      break;
    case 'week':
      rv = rv.add(1, 'week').hour(9).minute(0);
      text = rv.format('ddd MMM D \ [@] ha');
      break;
    case 'month':
      rv = rv.add(1, 'month').hour(9).minute(0);
      text = rv.format('ddd MMM D \ [@] ha');
      break;
    case NEXT_OPEN:
      rv = NEXT_OPEN;
      text = '';
      break;
    case PICK_TIME:
      rv = null;
      text = '';
      break;
    default:
      break;
  }
  return [rv, text];
}

export function confirmationTime(time, timeType) {
  if (timeType === NEXT_OPEN) {
    return browser.i18n.getMessage('timeNextOpenLong');
  }

  let rv;
  const endOfDay = moment().endOf('day');
  const endOfTomorrow = moment().add(1, 'day').endOf('day');
  const upcoming = moment(time);
  let timeStr = ']h';
  if (upcoming.minutes()) {
    timeStr += ':mm';
  }
  timeStr += 'a[';
  const weekday = ']ddd[';
  const month = ']MMM[';
  const date = ']D[';
  if (upcoming.isBefore(endOfDay)) {
    rv = `[${browser.i18n.getMessage('timeUpcomingToday', timeStr)}]`;
  } else if (upcoming.isBefore(endOfTomorrow)) {
    rv = `[${browser.i18n.getMessage('timeUpcomingTomorrow', timeStr)}]`;
  } else {
    rv = `[${browser.i18n.getMessage('timeUpcomingLater', [weekday, month, date, timeStr])}]`;
  }
  return upcoming.format(rv);
}
