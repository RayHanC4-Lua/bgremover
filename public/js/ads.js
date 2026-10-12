(function () {
  var cfg = window.ADS_CONFIG || {};
  var secs = document.querySelectorAll('.ad-sec');
  if (!cfg.client || !secs.length) return;

  function start() {
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(cfg.client);
    document.head.appendChild(s);
    secs.forEach(function (sec) {
      var slot = sec.querySelector('.ad-slot');
      var id = cfg.slots && cfg.slots[slot.dataset.slot];
      if (!id) return;
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      ins.setAttribute('data-ad-client', cfg.client);
      ins.setAttribute('data-ad-slot', id);
      ins.setAttribute('data-ad-format', 'auto');
      ins.setAttribute('data-full-width-responsive', 'true');
      slot.appendChild(ins);
      sec.classList.add('on');
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    });
  }

  if (document.readyState === 'complete') {
    start();
  } else {
    window.addEventListener('load', start);
  }
})();
