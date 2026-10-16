(function () {
  var root = document.documentElement;
  var el = document.getElementById('splash');
  if (!el) return;
  if (!root.classList.contains('twa')) {
    el.remove();
    return;
  }

  var fill = document.getElementById('splashFill');
  var text = document.getElementById('splashText');
  var start = Date.now();
  var MIN = 1400;
  var MAX = 12000;
  var done = false;

  function close() {
    if (done) return;
    done = true;
    var wait = Math.max(0, MIN - (Date.now() - start));
    setTimeout(function () {
      if (fill) fill.style.width = '100%';
      el.classList.add('out');
      setTimeout(function () { el.remove(); }, 450);
    }, wait);
  }

  window.addEventListener('model-progress', function (e) {
    var p = Math.max(0, Math.min(1, e.detail || 0));
    if (fill) fill.style.width = Math.round(10 + p * 80) + '%';
    if (text) text.textContent = p < 1 ? 'Downloading AI model ' + Math.round(p * 100) + '%' : 'Preparing AI model...';
  });

  window.addEventListener('app-ready', close);
  setTimeout(close, MAX);
  if (text) text.textContent = 'Loading...';
  if (fill) fill.style.width = '10%';
})();
