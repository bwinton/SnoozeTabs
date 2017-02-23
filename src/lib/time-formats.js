/* exported formats */

const formats = {
  default: {
    date_day: 'ddd, MMM D',
    date_year: 'MMM D, YYYY',
    short_time: '[@] ha',
    short_date_time: 'ddd [@] ha',
    long_date_time: 'ddd MMM D \ [@] ha'
  },
  'cs,de,dsb,hsb,hu,sk': {
    date_day: 'ddd D. MMM',
    date_year: 'D. MMM YYYY',
    short_time: '[@] H',
    short_date_time: 'ddd [@] H',
    long_date_time: 'ddd D. MMM \ [@] H'
  },
  'es,pt': {
    date_day: 'ddd D [de] MMM',
    date_year: 'D [de] MMM [de] YYYY',
    short_time: '[@] H',
    short_date_time: 'ddd [@] H',
    long_date_time: 'ddd D [de] MMM \ [@] H'
  },
  'fr,fy-NL,it,nl,ru,sv,tr': {
    date_day: 'ddd D MMM',
    date_year: 'D MMM YYYY',
    short_time: '[@] H',
    short_date_time: 'ddd [@] H',
    long_date_time: 'ddd D MMM \ [@] H'
  },
  'he': {
    date_day: 'ddd D [ב]MMM',
    date_year: 'D [ב]MMM YYYY',
    short_time: '[@] H',
    short_date_time: 'ddd [@] H',
    long_date_time: 'ddd D [ב]MMM \ [@] H'
  },
  'ja': {
    date_day: 'M月D日 ddd',
    date_year: 'YYYY年M月D日',
    short_time: '[@] ah',
    short_date_time: 'ddd [@] ah',
    long_date_time: 'M月D日 ddd \ [@] ah'
  },
  'zh-CN': {
    date_day: 'MMMD日ddd',
    date_year: 'YYYY年MMMD日',
    short_time: '[@] ah',
    short_date_time: 'ddd [@] ah',
    long_date_time: 'MMMD日ddd \ [@] ah'
  },
  'zh-TW': {
    date_day: 'MMMD日ddd',
    date_year: 'YYYY年MMMD日',
    short_time: '[@] ah',
    short_date_time: 'ddd [@] ah',
    long_date_time: 'MMMD日ddd \ [@] ah'
  }
};

const i18n_formats = ((locale) => {
  let rv = Object.assign({}, formats.default);
  const baseLocale = locale.split('_')[0];
  Object.keys(formats).forEach(key => {
    if (key.split(',').indexOf(baseLocale) !== -1) {
      rv = Object.assign(rv, formats[key]);
    }
  });
  Object.keys(formats).forEach(key => {
    if (key.split(',').indexOf(locale) !== -1) {
      rv = Object.assign(rv, formats[key]);
    }
  });
  return rv;
})(browser.i18n.getUILanguage() || 'en_US');

export const getFormat = function (format) {
  return i18n_formats[format];
};
