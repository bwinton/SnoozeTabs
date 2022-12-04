/* exported timeForId */

import moment from 'moment';
import { getLocalizedDateTime } from './time-formats';

const NEXT_BROWSER_LAUNCH = 'next';
const PICK_TIME = 'pick';
export {NEXT_BROWSER_LAUNCH, PICK_TIME};

export const times = [
  {id: 'later', icon: 'later_today.svg', title: browser.i18n.getMessage('timeLaterToday')},
  {id: 'tomorrow', icon: 'tomorrow.svg', title: browser.i18n.getMessage('timeTomorrow')},
  {id: 'weekend', icon: 'weekends.svg', title: browser.i18n.getMessage('timeThisWeekend')},
  {id: 'week', icon: 'next_week.svg', title: browser.i18n.getMessage('timeNextWeek')},
  {id: 'month', icon: 'next_month.svg', title: browser.i18n.getMessage('timeNextMonth')},
  {id: NEXT_BROWSER_LAUNCH, icon: 'next_browser_launch.svg', title: browser.i18n.getMessage('timeNextBrowserLaunch')},
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
      text = getLocalizedDateTime(rv, 'short_time');
      break;
    case 'later':
      // If we're in the middle of a work day, delay until 6pm.
      if (rv.isoWeekday() <= 5 && rv.hour() >= 9 && rv.hour() <= 17) {
        rv = rv.hour(18).minute(0);
      } else {
        // Otherwise, add three hours.
        rv = rv.add(3, 'hours').minute(0);
      }
      text = getLocalizedDateTime(rv, 'short_time_no_minutes');
      break;
    case 'tomorrow':
      rv = rv.add(1, 'day').hour(8).minute(30);
      text = getLocalizedDateTime(rv, 'short_date_time');
      break;
    case 'weekend':
      rv = rv.day(6).hour(8).minute(30);
      text = getLocalizedDateTime(rv, 'short_date_time');
      break;
    case 'week':
      rv = rv.add(1, 'week').hour(8).minute(30);
      text = getLocalizedDateTime(rv, 'long_date_time');
      break;
    case 'month':
      rv = rv.add(1, 'month').hour(8).minute(30);
      text = getLocalizedDateTime(rv, 'long_date_time');
      break;
    case NEXT_BROWSER_LAUNCH:
      rv = NEXT_BROWSER_LAUNCH;
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
  if (timeType === NEXT_BROWSER_LAUNCH) {
    return browser.i18n.getMessage('timeUpcomingNextBrowserLaunch');
  }

  let rv;
  const thisYear = moment().year();
  const endOfDay = moment().endOf('day');
  const endOfTomorrow = moment().add(1, 'day').endOf('day');
  const upcoming = moment(time);

  let timeStr;
  if (upcoming.minutes()) {
    timeStr = getLocalizedDateTime(upcoming, 'confirmation_time');
  } else {
    timeStr = getLocalizedDateTime(upcoming, 'confirmation_time_no_minutes');
  }

  let dateStr;
  if (upcoming.year() === thisYear) {
    dateStr = getLocalizedDateTime(upcoming, 'confirmation_date');
  } else {
    dateStr = getLocalizedDateTime(upcoming, 'confirmation_date_with_year');
  }

  if (upcoming.isBefore(endOfDay)) {
    rv = browser.i18n.getMessage('timeUpcomingToday', timeStr);
  } else if (upcoming.isBefore(endOfTomorrow)) {
    rv = browser.i18n.getMessage('timeUpcomingTomorrow', timeStr);
  } else {
    rv = browser.i18n.getMessage('timeUpcomingOther', [dateStr, timeStr]);
  }
  return rv;
}
