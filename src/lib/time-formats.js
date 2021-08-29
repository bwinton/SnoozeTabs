/* exported getLocalizedDateTime, use12hFormat */

const uiLocales = [browser.i18n.getUILanguage().replace('_', '-'), 'en-US'];

// Determine if locale is using 12h or 24h format
const dtf = new Intl.DateTimeFormat(uiLocales[0], {hour: 'numeric'});
export const use12hFormat = dtf.resolvedOptions().hour12;

// Turn "2 PM" into "2pm" for en-* locales
const tweakShortTimeForEn = str => str.replace(/ /g, '').toLowerCase();

const formats = {
  'date_day': new Intl.DateTimeFormat(uiLocales, { weekday: 'short', month: 'short', day: 'numeric' }),
  'date_year': new Intl.DateTimeFormat(uiLocales, { month: 'short', day: 'numeric', year: 'numeric' }),
  'long_date_time': new Intl.DateTimeFormat(uiLocales, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }),
  'short_date_time': new Intl.DateTimeFormat(uiLocales, { weekday: 'short', hour: 'numeric', minute: 'numeric' }),
  'short_time': new Intl.DateTimeFormat(uiLocales, { hour: 'numeric', minute: 'numeric' }),
  'short_time_no_minutes': new Intl.DateTimeFormat(uiLocales, { hour: 'numeric' }),

  'confirmation_time': new Intl.DateTimeFormat(uiLocales, { hour: 'numeric', minute: 'numeric' }),
  'confirmation_time_no_minutes': new Intl.DateTimeFormat(uiLocales, { hour: 'numeric', minute: 'numeric' }),
  'confirmation_time_no_minutes-en': new Intl.DateTimeFormat(uiLocales, { hour: 'numeric' }),
  'confirmation_date': new Intl.DateTimeFormat(uiLocales, { weekday: 'short', month: 'short', day: 'numeric' }),
  'confirmation_date_with_year': new Intl.DateTimeFormat(uiLocales, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),

  'long_date_time-en': [
    new Intl.DateTimeFormat(uiLocales, { weekday: 'short', month: 'short', day: 'numeric' }),
    { format: (date) => tweakShortTimeForEn(formats.short_time.format(date)) }
  ],
  'short_date_time-en': [
    new Intl.DateTimeFormat(uiLocales, { weekday: 'short' }),
    { format: (date) => tweakShortTimeForEn(formats.short_time.format(date)) }
  ],
  'short_time-en': [
    {format: () => ''},
    {format: (date) => tweakShortTimeForEn(formats.short_time.format(date)) }
  ],
  'short_time_no_minutes-en': [
    {format: () => ''},
    {format: (date) => tweakShortTimeForEn(formats.short_time_no_minutes.format(date)) }
  ],
  'year': new Intl.DateTimeFormat(uiLocales, { year: 'numeric' }),
  'date': new Intl.DateTimeFormat(uiLocales, { month: 'numeric', day: 'numeric', year: 'numeric' }),
  'day': new Intl.DateTimeFormat(uiLocales, { day: 'numeric' }),
  'month': new Intl.DateTimeFormat(uiLocales, { month: 'short' }),
  'dateTime': new Intl.DateTimeFormat(uiLocales, { month: 'numeric', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }),
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
