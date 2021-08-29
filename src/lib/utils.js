export function makeLogger(prefix) {
  return (...args) => {
    console.log(`SnoozeTabs (${prefix})`, ...args);  // eslint-disable-line no-console
  };
}

export const idForItem = item => `${item.time}-${item.url}`;

export const getLangDir = lang =>
  ['ar', 'fa', 'he'].indexOf(lang) === -1  ? 'ltr' : 'rtl';

export function getUrl(tab) {
  if (tab.url.startsWith('about:reader?url=')) {
    return decodeURIComponent(tab.url.replace('about:reader?url=', ''));
  }
  return tab.url;
}