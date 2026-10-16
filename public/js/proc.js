var box = document.getElementById('proc');
var canvas = document.getElementById('procCanvas');
var label = document.getElementById('procText');
var bar = document.getElementById('procBar');
var fill = document.getElementById('procFill');
var ctx = canvas ? canvas.getContext('2d') : null;

var active = false;
var raf = 0;
var src = null;
var W = 0;
var H = 0;
var dpr = 1;
var t0 = 0;
var dots = [];
var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var ACCENT = '79,140,255';
var MAX_BLUR = 7;

export function isActive() {
  return active;
}

export function setText(t) {
  if (label) label.textContent = t;
}

export function setProgress(p) {
  if (!bar) return;
  bar.hidden = false;
  bar.classList.remove('indeterminate');
  fill.style.width = Math.round(p * 100) + '%';
}

export function setIndeterminate(on) {
  if (!bar) return;
  if (on) {
    bar.hidden = true;
  } else {
    bar.hidden = false;
  }
}

function fit(w, h) {
  var maxW = box.parentElement.clientWidth || 320;
  var maxH = Math.max(240, window.innerHeight * 0.6);
  var s = Math.min(maxW / w, maxH / h);
  return { w: Math.round(w * s), h: Math.round(h * s) };
}

function makeDots(n) {
  var out = [];
  for (var i = 0; i < n; i++) {
    out.push({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.04,
      vy: (Math.random() - 0.5) * 0.04,
      r: 0.8 + Math.random() * 2.2,
      ph: Math.random() * Math.PI * 2,
      sp: 1.5 + Math.random() * 2.5
    });
  }
  return out;
}

function checker(c, w, h, size) {
  var dark = document.documentElement.getAttribute('data-theme') === 'dark';
  var a = dark ? '#2a2f3a' : '#d9dde6';
  var b = dark ? '#1f232b' : '#ffffff';
  c.fillStyle = b;
  c.fillRect(0, 0, w, h);
  c.fillStyle = a;
  for (var y = 0; y < h; y += size) {
    for (var x = ((y / size) % 2) * size; x < w; x += size * 2) {
      c.fillRect(x, y, size, size);
    }
  }
}

export function start(bmp) {
  if (!box || !ctx) return;
  stopLoop();
  active = true;
  box.hidden = false;
  box.classList.remove('done');
  setText('Removing background...');
  bar.hidden = true;

  dpr = Math.min(2, window.devicePixelRatio || 1);
  var size = fit(bmp.width, bmp.height);
  W = Math.round(size.w * dpr);
  H = Math.round(size.h * dpr);
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = size.w + 'px';
  canvas.style.height = size.h + 'px';

  src = document.createElement('canvas');
  src.width = W;
  src.height = H;
  var sc = src.getContext('2d');
  sc.imageSmoothingQuality = 'high';
  sc.drawImage(bmp, 0, 0, W, H);

  dots = makeDots(Math.round((size.w * size.h) / 1800) + 30);
  t0 = performance.now();

  if (reduce) {
    ctx.drawImage(src, 0, 0);
    return;
  }
  raf = requestAnimationFrame(waitFrame);
}

function drawBlurred(amount) {
  ctx.save();
  if (amount > 0.05) ctx.filter = 'blur(' + (amount * dpr).toFixed(2) + 'px) saturate(' + (1 - amount / MAX_BLUR * 0.35).toFixed(2) + ')';
  var pad = amount * dpr * 2;
  ctx.drawImage(src, -pad, -pad, W + pad * 2, H + pad * 2);
  ctx.restore();
}

function drawDots(now, strength) {
  var t = now / 1000;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (var i = 0; i < dots.length; i++) {
    var d = dots[i];
    d.x += d.vx / 60;
    d.y += d.vy / 60;
    if (d.x < 0) d.x += 1;
    if (d.x > 1) d.x -= 1;
    if (d.y < 0) d.y += 1;
    if (d.y > 1) d.y -= 1;
    var tw = 0.5 + 0.5 * Math.sin(t * d.sp + d.ph);
    var a = (0.25 + tw * 0.75) * strength;
    var r = d.r * dpr * (0.7 + tw * 0.6);
    var x = d.x * W;
    var y = d.y * H;
    var g = ctx.createRadialGradient(x, y, 0, x, y, r * 4);
    g.addColorStop(0, 'rgba(255,255,255,' + a.toFixed(3) + ')');
    g.addColorStop(0.35, 'rgba(' + ACCENT + ',' + (a * 0.55).toFixed(3) + ')');
    g.addColorStop(1, 'rgba(' + ACCENT + ',0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawScan(now) {
  var p = (Math.sin(now / 900) + 1) / 2;
  var y = p * H;
  var band = H * 0.18;
  var g = ctx.createLinearGradient(0, y - band, 0, y + band);
  g.addColorStop(0, 'rgba(' + ACCENT + ',0)');
  g.addColorStop(0.5, 'rgba(' + ACCENT + ',0.16)');
  g.addColorStop(1, 'rgba(' + ACCENT + ',0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, y - band, W, band * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillRect(0, y - dpr * 0.75, W, dpr * 1.5);
}

function waitFrame(now) {
  var e = (now - t0) / 1000;
  var k = Math.min(1, e / 1.6);
  var ease = 1 - Math.pow(1 - k, 3);
  ctx.clearRect(0, 0, W, H);
  drawBlurred(ease * MAX_BLUR);
  ctx.fillStyle = 'rgba(15,17,21,' + (ease * 0.18).toFixed(3) + ')';
  ctx.fillRect(0, 0, W, H);
  drawScan(now);
  drawDots(now, ease);
  raf = requestAnimationFrame(waitFrame);
}

export function reveal(cut) {
  return new Promise(function (resolve) {
    if (!active || !ctx || !src) {
      resolve();
      return;
    }
    stopLoop();
    if (reduce) {
      resolve();
      return;
    }

    var cutS = document.createElement('canvas');
    cutS.width = W;
    cutS.height = H;
    var cc = cutS.getContext('2d', { willReadFrequently: true });
    cc.imageSmoothingQuality = 'high';
    cc.drawImage(cut, 0, 0, W, H);

    var cell = Math.max(3, Math.round(3 * dpr));
    var gw = Math.ceil(W / cell);
    var gh = Math.ceil(H / cell);
    var alpha = cc.getImageData(0, 0, W, H).data;
    var thr = new Float32Array(gw * gh);
    var isBg = new Uint8Array(gw * gh);
    for (var gy = 0; gy < gh; gy++) {
      for (var gx = 0; gx < gw; gx++) {
        var px = Math.min(W - 1, gx * cell + (cell >> 1));
        var py = Math.min(H - 1, gy * cell + (cell >> 1));
        var a = alpha[(py * W + px) * 4 + 3];
        var idx = gy * gw + gx;
        isBg[idx] = a < 140 ? 1 : 0;
        thr[idx] = Math.random() * 0.7 + (gy / gh) * 0.3;
      }
    }

    var maskC = document.createElement('canvas');
    maskC.width = gw;
    maskC.height = gh;
    var mc = maskC.getContext('2d');
    var mi = mc.createImageData(gw, gh);

    var layer = document.createElement('canvas');
    layer.width = W;
    layer.height = H;
    var lc = layer.getContext('2d');

    var bgC = document.createElement('canvas');
    bgC.width = W;
    bgC.height = H;
    checker(bgC.getContext('2d'), W, H, Math.round(10 * dpr));

    var DUR = 1500;
    var r0 = performance.now();

    function frame(now) {
      var k = Math.min(1, (now - r0) / DUR);
      var t = k * 1.08;
      var md = mi.data;
      var spark = [];
      for (var i = 0; i < thr.length; i++) {
        var keep = !isBg[i] || thr[i] > t;
        md[i * 4 + 3] = keep ? 255 : 0;
        if (isBg[i] && thr[i] <= t && thr[i] > t - 0.05 && spark.length < 900) spark.push(i);
      }
      mc.putImageData(mi, 0, 0);

      lc.globalCompositeOperation = 'source-over';
      lc.clearRect(0, 0, W, H);
      var blur = Math.max(0, 1 - k * 3) * MAX_BLUR;
      lc.save();
      if (blur > 0.05) lc.filter = 'blur(' + (blur * dpr).toFixed(2) + 'px)';
      var pad = blur * dpr * 2;
      lc.drawImage(src, -pad, -pad, W + pad * 2, H + pad * 2);
      lc.restore();
      lc.globalCompositeOperation = 'destination-in';
      lc.imageSmoothingEnabled = false;
      lc.drawImage(maskC, 0, 0, gw * cell, gh * cell);
      lc.imageSmoothingEnabled = true;

      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(bgC, 0, 0);
      ctx.drawImage(layer, 0, 0);
      ctx.globalAlpha = Math.min(1, k * 2.5);
      ctx.drawImage(cutS, 0, 0);
      ctx.globalAlpha = 1;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (var j = 0; j < spark.length; j++) {
        var c = spark[j];
        var sx = (c % gw) * cell + cell / 2;
        var sy = Math.floor(c / gw) * cell + cell / 2;
        var life = 1 - (t - thr[c]) / 0.05;
        ctx.fillStyle = 'rgba(' + (j % 3 ? ACCENT : '255,255,255') + ',' + (0.85 * life).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(sx, sy, cell * 0.55 * (0.6 + life * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      if (k < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        raf = 0;
        setTimeout(resolve, 180);
      }
    }
    raf = requestAnimationFrame(frame);
  });
}

function stopLoop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

export function stop() {
  stopLoop();
  active = false;
  src = null;
  if (box) box.hidden = true;
}
