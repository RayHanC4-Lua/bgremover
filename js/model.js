const CACHE_NAME = 'bgr-model-v1';

export async function loadModel(url, onProgress) {
  let cache = null;
  try {
    cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(url);
    if (hit) return await hit.arrayBuffer();
  } catch (e) {
    cache = null;
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error('Model gagal diunduh');
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let got = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    got += value.length;
    if (onProgress && total) onProgress(got / total);
  }

  const bytes = new Uint8Array(got);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }

  try {
    if (cache) await cache.put(url, new Response(bytes.slice().buffer));
  } catch (e) {
    cache = null;
  }

  return bytes.buffer;
}
