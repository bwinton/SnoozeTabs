/* exported formats */

export const formats = {
  default: {
    short_time: '[@] ha',
    short_date_time: 'ddd [@] ha',
    long_date_time: 'ddd MMM D \ [@] ha'
  },
  'cs,de,dsb,hsb,hu,sk': {
    short_time: '[@] H',
    short_date_time: 'ddd [@] H',
    long_date_time: 'ddd D. MMM \ [@] H'
  },
  'es,pt': {
    short_time: '[@] H',
    short_date_time: 'ddd [@] H',
    long_date_time: 'ddd D [de] MMM \ [@] H'
  },
  'fr,fy-NL,it,nl,ru,sv,tr': {
    short_time: '[@] H',
    short_date_time: 'ddd [@] H',
    long_date_time: 'ddd D MMM \ [@] H'
  },
  'he': {
    short_time: '[@] H',
    short_date_time: 'ddd [@] H',
    long_date_time: 'ddd D [ב]MMM \ [@] H'
  },
  'ja': {
    short_time: '[@] ah',
    short_date_time: 'ddd [@] ah',
    long_date_time: 'M月D日 ddd \ [@] ah'
  },
  'zh-CN': {
    short_time: '[@] ah',
    short_date_time: 'ddd [@] ah',
    long_date_time: 'MMMD日ddd \ [@] ah'
  },
  'zh-TW': {
    short_time: '[@] ah',
    short_date_time: 'ddd [@] ah',
    long_date_time: 'MMMD日ddd \ [@] ah'
  }
};
