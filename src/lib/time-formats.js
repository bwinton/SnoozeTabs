/* exported getLocalizedDateTime, use12hFormat */

const uiLocales = [browser.i18n.getUILanguage().replace('_', '-'), 'en-US'];

// Determine if locale is using 12h or 24h format
const dtf = new Intl.DateTimeFormat(uiLocales[0], {hour: 'numeric'});
export const use12hFormat = dtf.resolvedOptions().hour12;

const formats = {
  'date_day': new Intl.DateTimeFormat(uiLocales, { weekday: 'short', month: 'short', day: 'numeric' }),
  'date_year': new Intl.DateTimeFormat(uiLocales, { month: 'short', day: 'numeric', year: 'numeric' }),
  'long_date_time': new Intl.DateTimeFormat(uiLocales, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
  'short_date_time': new Intl.DateTimeFormat(uiLocales, { weekday: 'short', hour: 'numeric', minute: 'numeric' }),
  'short_time': new Intl.DateTimeFormat(uiLocales, { hour: 'numeric', minute: 'numeric' }),

  'confirmation_time': new Intl.DateTimeFormat(uiLocales, { hour: 'numeric', minute: 'numeric' }),
  'confirmation_time_no_minutes': new Intl.DateTimeFormat(uiLocales, { hour: 'numeric', minute: 'numeric' }),
  'confirmation_time_no_minutes-en': new Intl.DateTimeFormat(uiLocales, { hour: 'numeric' }),
  'confirmation_date': new Intl.DateTimeFormat(uiLocales, { weekday: 'short', month: 'short', day: 'numeric' }),

  'long_date_time-en': [
    new Intl.DateTimeFormat(uiLocales, { weekday: 'short', month: 'short', day: 'numeric' }),
    new Intl.DateTimeFormat(uiLocales, { hour: 'numeric' })
  ],
  'short_date_time-en': [
    new Intl.DateTimeFormat(uiLocales, { weekday: 'short' }),
    new Intl.DateTimeFormat(uiLocales, { hour: 'numeric' })
  ],
  'short_time-en': [
    {format: () => ''},
    new Intl.DateTimeFormat(uiLocales, { hour: 'numeric' })
  ],
};

export const getLocalizedDateTime = function (time, format) {
  let formattedDateTime;

  let formatter = formats[format];
  if (formatter) {
    const date = time.toDate();
    const realLocale = formatter.resolvedOptions().locale;
    if (realLocale.startsWith('en') && formats[format + '-en']) {
      formatter = formats[format + '-en'];
      if (formatter[0]) {
        formattedDateTime = formatter[0].format(date) + ' @ ' + formatter[1].format(date);
      }
    }
    if (!formattedDateTime) {
      formattedDateTime = formatter.format(date);
    }
  }

  return formattedDateTime;
};
