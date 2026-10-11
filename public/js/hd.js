import { loadModel } from './model.js';

var HD_URL = 'models/modnet.onnx';
var REF = 512;

export function prepareInput(bmp) {
  var k = REF / Math.min(bmp.width, bmp.height);
  var w = Math.max(32, Math.floor((bmp.width * k) / 32) * 32);
  var h = Math.max(32, Math.floor((bmp.height * k) / 32) * 32);
  var c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  var ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, w, h);
  var d = ctx.getImageData(0, 0, w, h).data;
  var n = w * h;
  var out = new Float32Array(3 * n);
  for (var i = 0; i < n; i++) {
    var o = i * 4;
    out[i] = d[o] / 127.5 - 1;
    out[n + i] = d[o + 1] / 127.5 - 1;
    out[2 * n + i] = d[o + 2] / 127.5 - 1;
  }
  return { data: out, w: w, h: h };
}

export function alphaToCutout(bmp, alpha, w, h) {
  var n = w * h;
  var lo = Infinity;
  var hi = -Infinity;
  for (var i = 0; i < n; i++) {
    var v = alpha[i];
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  var useSig = lo < -0.01 || hi > 1.01;
  var mc = document.createElement('canvas');
  mc.width = w;
  mc.height = h;
  var mctx = mc.getContext('2d');
  var mi = mctx.createImageData(w, h);
  for (var j = 0; j < n; j++) {
    var a = alpha[j];
    if (useSig) a = 1 / (1 + Math.exp(-a));
    a = a < 0.03 ? 0 : a > 0.97 ? 1 : a;
    var g = Math.round(a * 255);
    var o = j * 4;
    mi.data[o] = g;
    mi.data[o + 1] = g;
    mi.data[o + 2] = g;
    mi.data[o + 3] = 255;
  }
  mctx.putImageData(mi, 0, 0);

  var W = bmp.width;
  var H = bmp.height;
  var sc = document.createElement('canvas');
  sc.width = W;
  sc.height = H;
  var sctx = sc.getContext('2d', { willReadFrequently: true });
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(mc, 0, 0, W, H);
  var md = sctx.getImageData(0, 0, W, H).data;

  var cut = document.createElement('canvas');
  cut.width = W;
  cut.height = H;
  var cctx = cut.getContext('2d', { willReadFrequently: true });
  cctx.drawImage(bmp, 0, 0);
  var img = cctx.getImageData(0, 0, W, H);
  var p = img.data;
  for (var q = 0; q < W * H; q++) {
    p[q * 4 + 3] = md[q * 4];
  }
  cctx.putImageData(img, 0, 0);
  return cut;
}

function call(worker, msg, transfer, expect) {
  return new Promise(function (resolve, reject) {
    worker.onmessage = function (e) {
      if (e.data.type === 'error') {
        reject(new Error(e.data.message));
      } else if (e.data.type === expect) {
        resolve(e.data);
      }
    };
    worker.onerror = function (e) {
      reject(new Error(e.message || 'HD worker failed'));
    };
    worker.postMessage(msg, transfer);
  });
}

export async function runHD(bmp, onStatus, onProgress) {
  var worker = new Worker(new URL('./hd-worker.js', import.meta.url), { type: 'module' });
  try {
    onStatus('Downloading Portrait HD model (one time only)...');
    var buf = await loadModel(HD_URL, onProgress);
    onStatus('Preparing Portrait HD model...');
    await call(worker, { type: 'init', buffer: buf }, [buf], 'ready');
    onStatus('Running Portrait HD...');
    var inp = prepareInput(bmp);
    var res = await call(worker, { type: 'run', input: inp.data, w: inp.w, h: inp.h }, [inp.data.buffer], 'result');
    return alphaToCutout(bmp, res.alpha, res.w, res.h);
  } finally {
    worker.terminate();
  }
}
