// BG Remover Worker
// Melayani file statis dari folder public dan API pendaftaran tester.
// Setiap pendaftaran dicek dulu lewat Cloudflare Turnstile, baru disimpan ke Supabase.

// Pola email sederhana, sama dengan cek di database
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Alamat verifikasi Turnstile dari Cloudflare
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Kirim balasan JSON
function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

// Cek token Turnstile ke Cloudflare
async function verifyTurnstile(token, ip, secret) {
  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  if (ip) form.append('remoteip', ip);
  const res = await fetch(SITEVERIFY, { method: 'POST', body: form });
  const data = await res.json().catch(() => ({}));
  return data.success === true;
}

// Simpan email dan nama tester ke Supabase memakai secret key
async function saveTester(env, email, name) {
  const key = env.SUPABASE_SERVICE_KEY;
  const headers = {
    'apikey': key,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };
  if (key.startsWith('eyJ')) headers['Authorization'] = 'Bearer ' + key;
  const url = env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/testers';
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ email, name }) });
  if (res.ok || res.status === 409) return true;
  const body = await res.json().catch(() => ({}));
  return body.code === '23505';
}

// Tangani POST /api/testers
async function handleTesters(request, env) {
  if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405);
  if (!env.TURNSTILE_SECRET || !env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) {
    return json({ ok: false, error: 'config' }, 503);
  }

  const body = await request.json().catch(() => null);
  if (!body) return json({ ok: false, error: 'body' }, 400);

  // Kolom jebakan bot, kalau terisi pura-pura berhasil
  if (body.website) return json({ ok: true });

  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.name || '').trim().slice(0, 80) || null;
  if (email.length > 120 || !EMAIL_RE.test(email)) return json({ ok: false, error: 'email' }, 400);
  if (!body.token) return json({ ok: false, error: 'captcha' }, 400);

  const ip = request.headers.get('CF-Connecting-IP');
  const human = await verifyTurnstile(String(body.token), ip, env.TURNSTILE_SECRET);
  if (!human) return json({ ok: false, error: 'captcha' }, 403);

  const saved = await saveTester(env, email, name);
  if (!saved) return json({ ok: false, error: 'save' }, 502);
  return json({ ok: true });
}

// Pintu masuk Worker
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/testers') {
      try {
        return await handleTesters(request, env);
      } catch (e) {
        return json({ ok: false, error: 'server' }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};
