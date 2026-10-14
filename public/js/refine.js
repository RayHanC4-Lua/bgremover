var EPS = 0.00005;
var RK = 0.005;
var LOW = 0.05;
var HIGH = 0.95;

function box(src, w, h, r) {
  var tmp = new Float32Array(w * h);
  var out = new Float32Array(w * h);
  for (var y = 0; y < h; y++) {
    var o = y * w;
    var sum = 0;
    var hi = Math.min(r, w - 1);
    for (var x = 0; x <= hi; x++) sum += src[o + x];
    for (var x2 = 0; x2 < w; x2++) {
      var x0 = Math.max(0, x2 - r);
      var x1 = Math.min(w - 1, x2 + r);
      tmp[o + x2] = sum / (x1 - x0 + 1);
      if (x2 + r + 1 < w) sum += src[o + x2 + r + 1];
      if (x2 - r >= 0) sum -= src[o + x2 - r];
    }
  }
  for (var x3 = 0; x3 < w; x3++) {
    var s2 = 0;
    var hi2 = Math.min(r, h - 1);
    for (var y0 = 0; y0 <= hi2; y0++) s2 += tmp[y0 * w + x3];
    for (var y2 = 0; y2 < h; y2++) {
      var ya = Math.max(0, y2 - r);
      var yb = Math.min(h - 1, y2 + r);
      out[y2 * w + x3] = s2 / (yb - ya + 1);
      if (y2 + r + 1 < h) s2 += tmp[(y2 + r + 1) * w + x3];
      if (y2 - r >= 0) s2 -= tmp[(y2 - r) * w + x3];
    }
  }
  return out;
}

function down(src, w, h, s) {
  if (s === 1) return { data: src, w: w, h: h };
  var lw = Math.ceil(w / s);
  var lh = Math.ceil(h / s);
  var sum = new Float32Array(lw * lh);
  var cnt = new Float32Array(lw * lh);
  for (var y = 0; y < h; y++) {
    var ly = Math.floor(y / s);
    for (var x = 0; x < w; x++) {
      var li = ly * lw + Math.floor(x / s);
      sum[li] += src[y * w + x];
      cnt[li] += 1;
    }
  }
  for (var i = 0; i < sum.length; i++) sum[i] /= cnt[i];
  return { data: sum, w: lw, h: lh };
}

function axis(n, ln, s) {
  var i0 = new Int32Array(n);
  var i1 = new Int32Array(n);
  var wt = new Float32Array(n);
  for (var v = 0; v < n; v++) {
    var f = (v + 0.5) / s - 0.5;
    var a = Math.floor(f);
    wt[v] = f - a;
    i0[v] = Math.max(0, Math.min(ln - 1, a));
    i1[v] = Math.max(0, Math.min(ln - 1, a + 1));
  }
  return { i0: i0, i1: i1, wt: wt };
}

export function guided3(C, p, w, h, r, eps, s) {
  var dR = down(C[0], w, h, s);
  var dG = down(C[1], w, h, s);
  var dB = down(C[2], w, h, s);
  var dp = down(p, w, h, s);
  var lw = dR.w;
  var lh = dR.h;
  var n = lw * lh;
  var rs = Math.max(1, Math.round(r / s));
  var R = dR.data, G = dG.data, B = dB.data, P = dp.data;
  function prod(x, y) {
    var o = new Float32Array(n);
    for (var i = 0; i < n; i++) o[i] = x[i] * y[i];
    return o;
  }
  var mR = box(R, lw, lh, rs), mG = box(G, lw, lh, rs), mB = box(B, lw, lh, rs), mP = box(P, lw, lh, rs);
  var cRR = box(prod(R, R), lw, lh, rs), cRG = box(prod(R, G), lw, lh, rs), cRB = box(prod(R, B), lw, lh, rs);
  var cGG = box(prod(G, G), lw, lh, rs), cGB = box(prod(G, B), lw, lh, rs), cBB = box(prod(B, B), lw, lh, rs);
  var cRP = box(prod(R, P), lw, lh, rs), cGP = box(prod(G, P), lw, lh, rs), cBP = box(prod(B, P), lw, lh, rs);
  var aR = new Float32Array(n), aG = new Float32Array(n), aB = new Float32Array(n), bb = new Float32Array(n);
  for (var k = 0; k < n; k++) {
    var rr = cRR[k] - mR[k] * mR[k] + eps;
    var rg = cRG[k] - mR[k] * mG[k];
    var rb = cRB[k] - mR[k] * mB[k];
    var gg = cGG[k] - mG[k] * mG[k] + eps;
    var gb = cGB[k] - mG[k] * mB[k];
    var bq = cBB[k] - mB[k] * mB[k] + eps;
    var vr = cRP[k] - mR[k] * mP[k];
    var vg = cGP[k] - mG[k] * mP[k];
    var vb = cBP[k] - mB[k] * mP[k];
    var det = rr * (gg * bq - gb * gb) - rg * (rg * bq - gb * rb) + rb * (rg * gb - gg * rb);
    var i00 = (gg * bq - gb * gb) / det;
    var i01 = (rb * gb - rg * bq) / det;
    var i02 = (rg * gb - rb * gg) / det;
    var i11 = (rr * bq - rb * rb) / det;
    var i12 = (rg * rb - rr * gb) / det;
    var i22 = (rr * gg - rg * rg) / det;
    var ar = i00 * vr + i01 * vg + i02 * vb;
    var ag = i01 * vr + i11 * vg + i12 * vb;
    var ab = i02 * vr + i12 * vg + i22 * vb;
    aR[k] = ar;
    aG[k] = ag;
    aB[k] = ab;
    bb[k] = mP[k] - ar * mR[k] - ag * mG[k] - ab * mB[k];
  }
  var maR = box(aR, lw, lh, rs), maG = box(aG, lw, lh, rs), maB = box(aB, lw, lh, rs), mbb = box(bb, lw, lh, rs);
  var ax = axis(w, lw, s);
  var ay = axis(h, lh, s);
  var q = new Float32Array(w * h);
  for (var y = 0; y < h; y++) {
    var r0 = ay.i0[y] * lw;
    var r1 = ay.i1[y] * lw;
    var wy = ay.wt[y];
    for (var x = 0; x < w; x++) {
      var wx = ax.wt[x];
      var w00 = (1 - wx) * (1 - wy);
      var w01 = wx * (1 - wy);
      var w10 = (1 - wx) * wy;
      var w11 = wx * wy;
      var p00 = r0 + ax.i0[x];
      var p01 = r0 + ax.i1[x];
      var p10 = r1 + ax.i0[x];
      var p11 = r1 + ax.i1[x];
      var idx = y * w + x;
      var v = (maR[p00] * w00 + maR[p01] * w01 + maR[p10] * w10 + maR[p11] * w11) * C[0][idx]
        + (maG[p00] * w00 + maG[p01] * w01 + maG[p10] * w10 + maG[p11] * w11) * C[1][idx]
        + (maB[p00] * w00 + maB[p01] * w01 + maB[p10] * w10 + maB[p11] * w11) * C[2][idx]
        + (mbb[p00] * w00 + mbb[p01] * w01 + mbb[p10] * w10 + mbb[p11] * w11);
      q[idx] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }
  return q;
}

function curve(q) {
  for (var i = 0; i < q.length; i++) {
    var t = (q[i] - LOW) / (HIGH - LOW);
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    q[i] = t * t * (3 - 2 * t);
  }
  return q;
}

export function refineAlpha(bmp, cut, opts) {
  var o = opts || {};
  var W = bmp.width;
  var H = bmp.height;
  var gc = document.createElement('canvas');
  gc.width = W;
  gc.height = H;
  var gx = gc.getContext('2d', { willReadFrequently: true });
  gx.drawImage(bmp, 0, 0);
  var img = gx.getImageData(0, 0, W, H).data;
  var ad = cut.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  var n = W * H;
  var C = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
  var p = new Float32Array(n);
  for (var i = 0; i < n; i++) {
    var j = i * 4;
    C[0][i] = img[j] / 255;
    C[1][i] = img[j + 1] / 255;
    C[2][i] = img[j + 2] / 255;
    p[i] = ad[j + 3] / 255;
  }
  var m = Math.max(W, H);
  var s = o.s || Math.max(1, Math.round(m / 512));
  var r = Math.max(3, Math.round(m * (o.rk || RK)));
  var q = guided3(C, p, W, H, r, o.eps || EPS, s);
  if (o.curve !== false) curve(q);
  return { q: q, rgba: img };
}

export function refineCutout(bmp, cut, opts) {
  var res = refineAlpha(bmp, cut, opts);
  var W = bmp.width;
  var H = bmp.height;
  var out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  var octx = out.getContext('2d', { willReadFrequently: true });
  var id = octx.createImageData(W, H);
  var d = id.data;
  var src = res.rgba;
  var q = res.q;
  for (var k = 0; k < q.length; k++) {
    var kk = k * 4;
    d[kk] = src[kk];
    d[kk + 1] = src[kk + 1];
    d[kk + 2] = src[kk + 2];
    d[kk + 3] = q[k] * 255;
  }
  octx.putImageData(id, 0, 0);
  return out;
}
