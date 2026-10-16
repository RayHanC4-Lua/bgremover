(function () {
  var cfg = window.TESTERS_CONFIG || {};
  var form = document.getElementById('tstForm');
  var email = document.getElementById('tstEmail');
  var name = document.getElementById('tstName');
  var web = document.getElementById('tstWeb');
  var agree = document.getElementById('tstAgree');
  var btn = document.getElementById('tstBtn');
  var msg = document.getElementById('tstMsg');
  var done = document.getElementById('tstDone');
  var KEY = 'bgr-tester';
  var RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function show(text, kind) {
    msg.textContent = text;
    msg.className = 'tst-msg' + (kind ? ' ' + kind : '');
  }

  function finish() {
    form.hidden = true;
    done.hidden = false;
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
  }

  try {
    if (localStorage.getItem(KEY) === '1') finish();
  } catch (e) {}

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = email.value.trim().toLowerCase();
    if (web.value) {
      finish();
      return;
    }
    if (!RE.test(v)) {
      show('Please enter a valid email address.', 'err');
      email.focus();
      return;
    }
    if (!agree.checked) {
      show('Please tick the box to confirm you can keep the app for 14 days.', 'err');
      return;
    }
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      show('Sign-up is not open yet. Please try again later.', 'err');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing you up...';
    show('');

    fetch(cfg.supabaseUrl.replace(/\/$/, '') + '/rest/v1/testers', {
      method: 'POST',
      headers: {
        'apikey': cfg.supabaseAnonKey,
        'Authorization': 'Bearer ' + cfg.supabaseAnonKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ email: v, name: name.value.trim().slice(0, 80) || null })
    }).then(function (res) {
      if (res.ok || res.status === 409) {
        finish();
        return;
      }
      return res.json().catch(function () { return {}; }).then(function (j) {
        if (j && j.code === '23505') {
          finish();
          return;
        }
        throw new Error('HTTP ' + res.status);
      });
    }).catch(function () {
      show('Something went wrong. Please check your connection and try again.', 'err');
    }).then(function () {
      btn.disabled = false;
      btn.textContent = 'Sign me up';
    });
  });
})();
