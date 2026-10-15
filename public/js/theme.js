(function () {
  var KEY = 'theme';
  var root = document.documentElement;

  function stored() {
    try {
      return localStorage.getItem(KEY);
    } catch (e) {
      return null;
    }
  }

  function system() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function apply(t) {
    root.setAttribute('data-theme', t);
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', t === 'dark' ? '#0f1115' : '#ffffff');
  }

  apply(stored() || system());

  var app = document.referrer.indexOf('android-app://') === 0;
  try {
    if (/[?&]source=twa(&|$)/.test(location.search)) sessionStorage.setItem('twa', '1');
    if (sessionStorage.getItem('twa') === '1') app = true;
    if (app) sessionStorage.setItem('twa', '1');
  } catch (e) {}
  if (app) root.classList.add('twa');

  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('themeToggle');
    if (!b) return;
    b.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      try {
        localStorage.setItem(KEY, next);
      } catch (e) {}
    });
  });
})();
