export function makeLogger(prefix) {
  return (...args) => {
    console.log(`SnoozeTabs (${prefix})`, ...args);  // eslint-disable-line no-console
  };
}

export const idForItem = item => `${item.time}-${item.url}`;
