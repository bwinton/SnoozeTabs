setTimeout(function () {
  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.src = 'snooze-content.js';
  document.getElementsByTagName('head')[0].appendChild(s);
}, 1);
