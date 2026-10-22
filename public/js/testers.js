// Form pendaftaran tester BG Remover
// Menampilkan Cloudflare Turnstile, lalu mengirim email ke /api/testers.
// Penyimpanan ke Supabase dilakukan oleh Worker, bukan dari browser.

(function () {
  // Elemen form
  var form = document.getElementById('tstForm');
  var email = document.getElementById('tstEmail');
  var name = document.getElementById('tstName');
  var web = document.getElementById('tstWeb');
  var agree = document.getElementById('tstAgree');
  var btn = document.getElementById('tstBtn');
  var msg = document.getElementById('tstMsg');
  var done = document.getElementById('tstDone');
  var box = document.getElementById('tstCaptcha');

  // Pengaturan
  var KEY = 'bgr-tester';
  var RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var SITEKEY = window.TURNSTILE_SITEKEY || '';

  // Status Turnstile
  var widget = null;
  var token = '';

  // Tampilkan pesan di bawah tombol
  function show(text, kind) {
    msg.textContent = text;
    msg.className = 'tst-msg' + (kind ? ' ' + kind : '');
  }

  // Ganti form dengan tampilan sukses
  function finish() {
    form.hidden = true;
    done.hidden = false;
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
  }

  // Minta token baru setelah gagal
  function resetCaptcha() {
    token = '';
    if (widget !== null && window.turnstile) window.turnstile.reset(widget);
  }

  // Dipanggil oleh script Turnstile setelah selesai dimuat
  window.onTstTurnstile = function () {
    if (!SITEKEY || !box) return;
    widget = window.turnstile.render(box, {
      sitekey: SITEKEY,
      theme: 'auto',
      callback: function (t) { token = t; show(''); },
      'expired-callback': function () { token = ''; },
      'error-callback': function () { token = ''; }
    });
  };

  // Sudah pernah daftar di browser ini
  try {
    if (localStorage.getItem(KEY) === '1') finish();
  } catch (e) {}

  // Kirim form
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
    if (!SITEKEY) {
      show('Sign-up is not open yet. Please try again later.', 'err');
      return;
    }
    if (!token) {
      show('Please complete the check above the button first.', 'err');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing you up...';
    show('');

    fetch('/api/testers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: v, name: name.value.trim().slice(0, 80), website: web.value, token: token })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (j) {
        if (res.ok && j.ok) {
          finish();
          return;
        }
        if (j.error === 'captcha') {
          show('The check expired. Please complete it again.', 'err');
        } else if (j.error === 'email') {
          show('Please enter a valid email address.', 'err');
        } else {
          show('Something went wrong. Please try again in a moment.', 'err');
        }
        resetCaptcha();
      });
    }).catch(function () {
      show('Something went wrong. Please check your connection and try again.', 'err');
      resetCaptcha();
    }).then(function () {
      btn.disabled = false;
      btn.textContent = 'Sign me up';
    });
  });
})();
