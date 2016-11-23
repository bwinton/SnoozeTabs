/* globals moment:false */
/* exported timeForId */

function timeForId(time, id) {
  var rv = moment(time);
  var text = rv.fromNow();
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
    default:
      break;
  }
  return [rv, text];
}