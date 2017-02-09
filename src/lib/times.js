/* exported timeForId */
import moment from 'moment';

const NEXT_OPEN = 'next';
const PICK_TIME = 'pick';
export {NEXT_OPEN, PICK_TIME};

export const times = [
  {id: 'later', icon: 'later_today.svg', title: 'Later Today'},
  {id: 'tomorrow', icon: 'tomorrow.svg', title: 'Tomorrow'},
  {id: 'weekend', icon: 'weekends.svg', title: 'This Weekend'},
  {id: 'week', icon: 'next_week.svg', title: 'Next Week'},
  {id: 'month', icon: 'next_month.svg', title: 'Next Month'},
  {id: NEXT_OPEN, icon: 'next_open.svg', title: 'Next Open'},
  {id: PICK_TIME, icon: 'pick_date.svg', title: 'Pick a Date/Time'}
];

if (process.env.NODE_ENV === 'development') {
  times.unshift({id: 'debug', icon: 'nightly.svg', title: 'Real Soon Now!'});
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
    return 'the next time Firefox opens';
  }

  let rv;
  const endOfDay = moment().endOf('day');
  const endOfTomorrow = moment().add(1, 'day').endOf('day');
  const upcoming = moment(time);
  if (upcoming.isBefore(endOfDay)) {
    rv = '[later today at ]h';
  } else if (upcoming.isBefore(endOfTomorrow)) {
    rv = '[tomorrow at ]h';
  } else {
    rv = 'ddd[,] MMM D[ at ]h';
  }
  if (upcoming.minutes()) {
    rv += ':mm';
  }
  rv += 'a';
  return upcoming.format(rv);
}
