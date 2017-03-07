export function makeLogger(prefix) {
  return (...args) => {
    console.log(`SnoozeTabs (${prefix})`, ...args);  // eslint-disable-line no-console
  };
}
