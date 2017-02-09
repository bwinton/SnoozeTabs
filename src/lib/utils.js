export function makeLogger(prefix) {
  if (process.env.NODE_ENV === 'development') {
    return (...args) => {
      console.log(`SnoozeTabs (${prefix})`, ...args);  // eslint-disable-line no-console
    };
  } else {
    return () => {};
  }
}
