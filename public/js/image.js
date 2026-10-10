const SIZE = 320;
const MAX_SIDE = 2048;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
var debugMode = false;

export async function bitmapFromFile(file) {
  var bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  var biggest = Math.max(bmp.width, bmp.height);
  var scale = Math.min(1, MAX_SIDE / biggest);
  if (scale == 1) return bmp;
  var w = Math.round(bmp.width * scale);
  var heigth = Math.round(bmp.height * scale);
  var small = await createImageBitmap(bmp, {resizeWidth: w, resizeHeight: heigth, resizeQuality: 'high'});
  bmp.close();
  return small;
}

export function toInput(bmp) {
  var c = document.createElement('canvas');
  c.width = SIZE; c.height = SIZE;
  var ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(bmp, 0, 0, SIZE, SIZE);
  var d = ctx.getImageData(0, 0, SIZE, SIZE).data;
  var n = SIZE * SIZE;

  var max = 1;
  for (var i = 0; i < n; i++) {
    var o = i * 4;
    if (d[o] > max) max = d[o];
    if (d[o+1] > max) max = d[o+1];
    if (d[o+2] > max) max = d[o+2];
  }

  var out = new Float32Array(3 * n);
  for (var i2 = 0; i2 < n; i2++) {
    var o2 = i2 * 4;
    for (var k = 0; k < 3; k++) {
      out[k * n + i2] = (d[o2 + k] / max - MEAN[k]) / STD[k];
    }
  }
  if (debugMode) console.log('input redy', max);
  return out;
}

export function buildCutout(bmp, mask) {
  var min = Infinity;
  var max = -Infinity;
  for (var i = 0; i < mask.length; i++) {
    var v0 = mask[i];
    if (v0 < min) min = v0;
    if (v0 > max) max = v0;
  }
  var range = max - min || 1;

  var mc = document.createElement('canvas');
  mc.width = SIZE; mc.height = SIZE;
  var mctx = mc.getContext('2d');
  var mi = mctx.createImageData(SIZE, SIZE);
  for (var j = 0; j < mask.length; j++) {
    var t = (mask[j] - min) / range;
    var s = Math.min(1, Math.max(0, (t - 0.25) / 0.5));
    var v = Math.round(s * s * (3 - 2 * s) * 255);
    var o = j * 4;
    mi.data[o] = v;
    mi.data[o+1] = v;
    mi.data[o+2] = v;
    mi.data[o+3] = 255;
  }
  mctx.putImageData(mi, 0, 0);

  var w = bmp.width;
  var h = bmp.height;
  var sc = document.createElement('canvas');
  sc.width = w; sc.height = h;
  var sctx = sc.getContext('2d', { willReadFrequently: true });
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(mc, 0, 0, w, h);
  var md = sctx.getImageData(0, 0, w, h).data;

  var cut = document.createElement('canvas');
  cut.width = w; cut.height = h;
  var cctx = cut.getContext('2d', { willReadFrequently: true });
  cctx.drawImage(bmp, 0, 0);
  var img = cctx.getImageData(0, 0, w, h);
  var p = img.data;
  for (var q = 0; q < w * h; q++) {
    p[q * 4 + 3] = md[q * 4];
  }
  cctx.putImageData(img, 0, 0);
  return cut;
}

export function compose(cut, bg, target) {
  target.width = cut.width;
  target.height = cut.height;
  var ctx = target.getContext('2d');
  ctx.clearRect(0, 0, target.width, target.height);
  if (bg && bg !== 'transparent') {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, target.width, target.height);
  }
  ctx.drawImage(cut, 0, 0);
}

export function oldCompose(cut, target) {
  target.width = cut.width;
  target.height = cut.height;
  var ctx = target.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, target.width, target.height);
  ctx.drawImage(cut, 0, 0);
}

export function scaleDown(w, heigth, max) {
  var r = Math.min(1, max / Math.max(w, heigth));
  return [Math.round(w * r), Math.round(heigth * r)];
}
