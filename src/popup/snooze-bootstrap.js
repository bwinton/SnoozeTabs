log('init');
const NARROW_MIN_WIDTH = 320;

if (process.env.NODE_ENV !== 'production') {
  document.body.classList.add('development');
}

// HACK: debounce resize event handling with a flag & requestAnimationFrame
// https://developer.mozilla.org/en-US/docs/Web/Events/resize
let resizePending = false;
const resizeHandler = () => {
  const width = document.body.clientWidth;

  if (width === 0) {
    log('resize (zero - ignored)', width);
    return;
  }

  if (resizePending) {
    log('resize (ignored)', width);
    return;
  }

  log('resize (pending)', width);
  resizePending = true;

  window.requestAnimationFrame(() => {
    log('resize (handled)', width, width < NARROW_MIN_WIDTH ? 'menu' : 'toolbar');
    document.body.classList[width < NARROW_MIN_WIDTH ? 'add' : 'remove']('narrow');
    resizePending = false;
    window.removeEventListener('resize', resizeHandler);
  });
};

window.addEventListener('resize', resizeHandler);

setTimeout(function () {
  log('load FE');
  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = 'snooze-content.js';
  document.getElementsByTagName('head')[0].appendChild(s);
}, 1);

function log() {
  const args = Array.prototype.slice.call(arguments);
  args.unshift('Snooze Tabs (bootstrap)');
  console.log.apply(console, args); // eslint-disable-line no-console
}
