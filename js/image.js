const SIZE = 320;
const MAX_SIDE = 2048;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];

export async function bitmapFromFile(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  if (scale === 1) return bmp;
  const w = Math.round(bmp.width * scale);
  const h = Math.round(bmp.height * scale);
  const small = await createImageBitmap(bmp, {
    resizeWidth: w,
    resizeHeight: h,
    resizeQuality: 'high'
  });
  bmp.close();
  return small;
}

export function toInput(bmp) {
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(bmp, 0, 0, SIZE, SIZE);
  const d = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const n = SIZE * SIZE;

  let max = 1;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    if (d[o] > max) max = d[o];
    if (d[o + 1] > max) max = d[o + 1];
    if (d[o + 2] > max) max = d[o + 2];
  }

  const out = new Float32Array(3 * n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    for (let k = 0; k < 3; k++) {
      out[k * n + i] = (d[o + k] / max - MEAN[k]) / STD[k];
    }
  }
  return out;
}

export function buildCutout(bmp, mask) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < mask.length; i++) {
    const v = mask[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;

  const mc = document.createElement('canvas');
  mc.width = SIZE;
  mc.height = SIZE;
  const mctx = mc.getContext('2d');
  const mi = mctx.createImageData(SIZE, SIZE);
  for (let i = 0; i < mask.length; i++) {
    const t = (mask[i] - min) / range;
    const s = Math.min(1, Math.max(0, (t - 0.25) / 0.5));
    const v = Math.round(s * s * (3 - 2 * s) * 255);
    const o = i * 4;
    mi.data[o] = v;
    mi.data[o + 1] = v;
    mi.data[o + 2] = v;
    mi.data[o + 3] = 255;
  }
  mctx.putImageData(mi, 0, 0);

  const w = bmp.width;
  const h = bmp.height;

  const sc = document.createElement('canvas');
  sc.width = w;
  sc.height = h;
  const sctx = sc.getContext('2d', { willReadFrequently: true });
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(mc, 0, 0, w, h);
  const md = sctx.getImageData(0, 0, w, h).data;

  const cut = document.createElement('canvas');
  cut.width = w;
  cut.height = h;
  const cctx = cut.getContext('2d', { willReadFrequently: true });
  cctx.drawImage(bmp, 0, 0);
  const img = cctx.getImageData(0, 0, w, h);
  const p = img.data;
  for (let i = 0; i < w * h; i++) {
    p[i * 4 + 3] = md[i * 4];
  }
  cctx.putImageData(img, 0, 0);
  return cut;
}

export function compose(cut, bg, target) {
  target.width = cut.width;
  target.height = cut.height;
  const ctx = target.getContext('2d');
  ctx.clearRect(0, 0, target.width, target.height);
  if (bg && bg !== 'transparent') {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, target.width, target.height);
  }
  ctx.drawImage(cut, 0, 0);
}
