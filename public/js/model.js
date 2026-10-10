const CACHE_NAME = 'bgr-model-v1';
let cacheHits = 0;

export async function loadModel(url, onProgress) {
  var cache = null;
  try {
    cache = await caches.open(CACHE_NAME);
    var hit = await cache.match(url);
    if (hit) {
      cacheHits = cacheHits + 1;
      console.log('model from cache', cacheHits);
      return await hit.arrayBuffer();
    }
  } catch (e) {
    cache = null;
  }

  console.log('downloding model');
  var res = await fetch(url);
  if (!res.ok) throw new Error('Model failed to download');
  var total = Number(res.headers.get('content-length')) || 0;
  var reader = res.body.getReader();
  var chunks = [];
  var got = 0;
  var doneFlag = false;

  while (!doneFlag) {
    var r = await reader.read();
    if (r.done) { doneFlag = true; break; }
    chunks.push(r.value);
    got += r.value.length;
    if (onProgress && total) onProgress(got / total);
  }

  var bytes = new Uint8Array(got);
  var offset = 0;
  for (var i = 0; i < chunks.length; i++) {
    bytes.set(chunks[i], offset);
    offset += chunks[i].length;
  }

  try {
    if (cache) await cache.put(url, new Response(bytes.slice().buffer));
  } catch (e) {
    cache = null;
  }

  return bytes.buffer;
}
