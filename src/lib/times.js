/* exported timeForId */
import moment from 'moment';

const NEXT_OPEN = 'next';
export {NEXT_OPEN};

export const times = [
  {id: 'debug', icon: 'nightly.svg', title: 'Real Soon Now!'},
  {id: 'later', icon: 'later_today.svg', title: 'Later Today'},
  {id: 'tomorrow', icon: 'tomorrow.svg', title: 'Tomorrow'},
  {id: 'weekend', icon: 'weekends.svg', title: 'This Weekend'},
  {id: 'week', icon: 'next_week.svg', title: 'Next Week'},
  {id: 'month', icon: 'next_month.svg', title: 'Next Month'},
  {id: NEXT_OPEN, icon: 'next_open.svg', title: 'Next Open'},
  {id: 'pick', icon: 'pick_date.svg', title: 'Pick a Date/Time'}
];

export function timeForId(time, id) {
  let rv = moment(time);
  let text = rv.fromNow();
  switch (id) {
    case 'debug':
      rv = rv.add(5, 'seconds');
      text = rv.format('[@]ha');
      break;
    case 'later':
      rv = rv.add(3, 'hours');
      text = rv.format('[@]ha');
      break;
    case 'tomorrow':
      rv = rv.add(1, 'day').hour(9);
      text = rv.format('ddd [@]ha');
      break;
    case 'weekend':
      rv = rv.day(6).hour(9);
      text = rv.format('ddd [@]ha');
      break;
    case 'week':
      rv = rv.add(1, 'week').hour(9);
      text = rv.format('ddd MMM D \ [@]ha');
      break;
    case 'month':
      rv = rv.add(1, 'month').hour(9);
      text = rv.format('ddd MMM D \ [@]ha');
      break;
    case NEXT_OPEN:
      rv = NEXT_OPEN;
      text = '';
      break;
    case 'pick':
      rv = null;
      text = '';
      break;
    default:
      break;
  }
  return [rv, text];
}
