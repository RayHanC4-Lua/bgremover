var PRESETS = {
  original: null,
  square: [1000, 1000],
  portrait: [1080, 1350],
  story: [1080, 1920],
  wide: [1920, 1080],
  id: [900, 1200]
};

var GRADS = {
  sunset: ['#ff9a5a', '#ff4f8b'],
  ocean: ['#4facfe', '#00f2fe'],
  mint: ['#43e97b', '#38f9d7'],
  night: ['#0f2027', '#2c5364']
};

var $ = function (id) { return document.getElementById(id); };
var els = {};
var orig = null;
var cut = null;
var bbox = null;
var bgImg = null;
var undo = [];
var raf = 0;
var drawing = false;
var last = null;

var s = {
  bg: 'transparent',
  preset: 'original',
  pad: 8,
  shadow: 0,
  outline: 0,
  outColor: '#ffffff',
  tool: 'bg',
  brush: 'off',
  size: 40
};

function targetSize(maxSide) {
  var p = PRESETS[s.preset];
  var w = p ? p[0] : cut.width;
  var h = p ? p[1] : cut.height;
  var k = Math.min(1, maxSide / Math.max(w, h));
  return [Math.max(1, Math.round(w * k)), Math.max(1, Math.round(h * k))];
}

function getBBox() {
  if (bbox) return bbox;
  var w = cut.width;
  var h = cut.height;
  var d = cut.getContext('2d').getImageData(0, 0, w, h).data;
  var x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] > 10) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) {
    bbox = [0, 0, w, h];
  } else {
    bbox = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
  }
  return bbox;
}

function placement(W, H) {
  if (s.preset === 'original') {
    return { sx: 0, sy: 0, sw: cut.width, sh: cut.height, dx: 0, dy: 0, dw: W, dh: H };
  }
  var b = getBBox();
  var pad = s.pad / 100;
  var aw = W * (1 - 2 * pad);
  var ah = H * (1 - 2 * pad);
  var k = Math.min(aw / b[2], ah / b[3]);
  var dw = b[2] * k;
  var dh = b[3] * k;
  return { sx: b[0], sy: b[1], sw: b[2], sh: b[3], dx: (W - dw) / 2, dy: (H - dh) / 2, dw: dw, dh: dh };
}

function drawCover(ctx, img, W, H, zoom) {
  var z = zoom || 1;
  var k = Math.max(W / img.width, H / img.height) * z;
  var dw = img.width * k;
  var dh = img.height * k;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

function drawBlur(ctx, W, H) {
  var probe = document.createElement('canvas').getContext('2d');
  if (typeof probe.filter === 'string') {
    ctx.save();
    ctx.filter = 'blur(' + Math.max(6, Math.round(Math.max(W, H) / 45)) + 'px)';
    drawCover(ctx, orig, W, H, 1.12);
    ctx.restore();
    return;
  }
  var sw = Math.max(8, Math.round(W / 4));
  var sh = Math.max(8, Math.round(H / 4));
  var tw = Math.max(6, Math.round(W / 28));
  var th = Math.max(6, Math.round(H / 28));
  var a = document.createElement('canvas');
  a.width = tw;
  a.height = th;
  var actx = a.getContext('2d');
  actx.imageSmoothingQuality = 'high';
  drawCover(actx, orig, tw, th, 1.12);
  var b = document.createElement('canvas');
  b.width = sw;
  b.height = sh;
  var bctx = b.getContext('2d');
  bctx.imageSmoothingQuality = 'high';
  bctx.drawImage(a, 0, 0, sw, sh);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(b, 0, 0, W, H);
}

function drawBackground(ctx, W, H) {
  var b = s.bg;
  if (b === 'transparent') return;
  if (b === 'blur') {
    drawBlur(ctx, W, H);
    return;
  }
  if (b === 'image') {
    if (bgImg) drawCover(ctx, bgImg, W, H, 1);
    return;
  }
  if (b.indexOf('g:') === 0) {
    var g = GRADS[b.slice(2)];
    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, g[0]);
    grad.addColorStop(1, g[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  ctx.fillStyle = b;
  ctx.fillRect(0, 0, W, H);
}

function drawOutline(lctx, box, r, W, H) {
  var sil = document.createElement('canvas');
  sil.width = W;
  sil.height = H;
  var c = sil.getContext('2d');
  c.drawImage(cut, box.sx, box.sy, box.sw, box.sh, box.dx, box.dy, box.dw, box.dh);
  c.globalCompositeOperation = 'source-in';
  c.fillStyle = s.outColor;
  c.fillRect(0, 0, W, H);
  var n = Math.max(16, Math.min(48, r * 3));
  for (var i = 0; i < n; i++) {
    var a = (i / n) * Math.PI * 2;
    lctx.drawImage(sil, Math.cos(a) * r, Math.sin(a) * r);
  }
}

function build(maxSide) {
  var sz = targetSize(maxSide);
  var W = sz[0];
  var H = sz[1];
  var out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  var ctx = out.getContext('2d');
  drawBackground(ctx, W, H);
  var layer = document.createElement('canvas');
  layer.width = W;
  layer.height = H;
  var lctx = layer.getContext('2d');
  var box = placement(W, H);
  var r = Math.round((s.outline * Math.max(W, H)) / 900);
  if (r > 0) drawOutline(lctx, box, r, W, H);
  lctx.drawImage(cut, box.sx, box.sy, box.sw, box.sh, box.dx, box.dy, box.dw, box.dh);
  if (s.shadow > 0) {
    var m = Math.max(W, H);
    var q = s.shadow / 100;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,' + (0.15 + q * 0.45) + ')';
    ctx.shadowBlur = m * (0.01 + q * 0.04);
    ctx.shadowOffsetY = m * (0.006 + q * 0.02);
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
  } else {
    ctx.drawImage(layer, 0, 0);
  }
  return out;
}

function render() {
  if (!cut) return;
  var o = build(1000);
  var c = els.out;
  c.width = o.width;
  c.height = o.height;
  c.getContext('2d').drawImage(o, 0, 0);
  if (cmpOn) drawCmp();
}

function schedule() {
  if (raf) return;
  raf = requestAnimationFrame(function () {
    raf = 0;
    render();
  });
}

function markBg(el) {
  var all = document.querySelectorAll('#swatches button, #grads .grad, #blurBg, #bgUp');
  for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
  if (el) el.classList.add('active');
}

function setPreset(p) {
  s.preset = p;
  var all = els.presets.querySelectorAll('button[data-p]');
  for (var i = 0; i < all.length; i++) {
    all[i].classList.toggle('active', all[i].dataset.p === p);
  }
  schedule();
}

function setBrush(mode) {
  s.brush = mode;
  els.bEraser.classList.toggle('active', mode === 'erase');
  els.bRestore.classList.toggle('active', mode === 'restore');
  els.out.classList.toggle('brush', mode !== 'off');
}

function setTool(t) {
  s.tool = t;
  var tabs = els.toolTabs.querySelectorAll('.tt');
  for (var i = 0; i < tabs.length; i++) {
    tabs[i].classList.toggle('active', tabs[i].dataset.tool === t);
  }
  ['bg', 'brush', 'size', 'style'].forEach(function (k) {
    $('p-' + k).hidden = k !== t;
  });
  if (t === 'brush') {
    if (s.preset !== 'original') setPreset('original');
    setBrush('erase');
  } else {
    setBrush('off');
  }
}

function pos(e) {
  var r = els.out.getBoundingClientRect();
  var x = ((e.clientX - r.left) * cut.width) / r.width;
  var y = ((e.clientY - r.top) * cut.height) / r.height;
  return [x, y];
}

function pushUndo() {
  undo.push(cut.getContext('2d').getImageData(0, 0, cut.width, cut.height));
  if (undo.length > 4) undo.shift();
}

function doUndo() {
  if (!undo.length) return;
  cut.getContext('2d').putImageData(undo.pop(), 0, 0);
  bbox = null;
  schedule();
}

function stroke(a, b) {
  var ctx = cut.getContext('2d');
  var d = (s.size * cut.width) / 1000;
  ctx.save();
  if (s.brush === 'erase') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = d;
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
  } else {
    var dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
    var steps = Math.max(1, Math.ceil(dist / (d / 4)));
    var r = d / 2;
    ctx.beginPath();
    for (var i = 0; i <= steps; i++) {
      var t = i / steps;
      var x = a[0] + (b[0] - a[0]) * t;
      var y = a[1] + (b[1] - a[1]) * t;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    ctx.clip();
    ctx.drawImage(orig, 0, 0, cut.width, cut.height);
  }
  ctx.restore();
}

function onDown(e) {
  if (s.brush === 'off' || !cut || s.preset !== 'original') return;
  e.preventDefault();
  try { els.out.setPointerCapture(e.pointerId); } catch (err) {}
  pushUndo();
  drawing = true;
  last = pos(e);
  stroke(last, last);
  schedule();
}

function onMove(e) {
  if (!drawing) return;
  e.preventDefault();
  var p = pos(e);
  stroke(last, p);
  last = p;
  schedule();
}

function onUp() {
  if (!drawing) return;
  drawing = false;
  bbox = null;
}

function download() {
  if (!cut) return;
  var o = build(Infinity);
  var f = els.fmt.value;
  var type = f === 'jpg' ? 'image/jpeg' : f === 'webp' ? 'image/webp' : 'image/png';
  if (f === 'jpg') {
    var flat = document.createElement('canvas');
    flat.width = o.width;
    flat.height = o.height;
    var fc = flat.getContext('2d');
    fc.fillStyle = '#ffffff';
    fc.fillRect(0, 0, o.width, o.height);
    fc.drawImage(o, 0, 0);
    o = flat;
  }
  o.toBlob(function (blob) {
    if (!blob) return;
    var ext = blob.type === 'image/jpeg' ? 'jpg' : blob.type === 'image/webp' ? 'webp' : 'png';
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'result-' + Date.now() + '.' + ext;
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }, type, 0.92);
}

var cmpOn = false;
var cmpPos = 50;
var cmpDrag = false;
var cmpAnim = 0;

function setCmp(v) {
  cmpPos = Math.max(0, Math.min(100, v));
  els.cmp.style.setProperty('--cmp', cmpPos + '%');
}

function drawCmp() {
  var c = els.cmpCanvas;
  c.width = els.out.width;
  c.height = els.out.height;
  drawCover(c.getContext('2d'), orig, c.width, c.height, 1);
}

function sweepCmp() {
  cancelAnimationFrame(cmpAnim);
  var t0 = performance.now();
  setCmp(94);
  function step(now) {
    var k = Math.min(1, (now - t0) / 650);
    var e = 1 - Math.pow(1 - k, 3);
    setCmp(94 + (50 - 94) * e);
    if (k < 1 && cmpOn) cmpAnim = requestAnimationFrame(step);
  }
  cmpAnim = requestAnimationFrame(step);
}

function setCompare(on) {
  cmpOn = on;
  els.cmp.hidden = !on;
  els.cmpBtn.textContent = on ? 'Hide compare' : 'Compare';
  if (!on) {
    cancelAnimationFrame(cmpAnim);
    return;
  }
  if (s.preset !== 'original') setPreset('original');
  render();
  drawCmp();
  sweepCmp();
}

function cmpMove(e) {
  var r = els.cmp.getBoundingClientRect();
  setCmp(((e.clientX - r.left) / r.width) * 100);
}

function resetUI() {
  s.bg = 'transparent';
  s.preset = 'original';
  s.pad = 8;
  s.shadow = 0;
  s.outline = 0;
  s.outColor = '#ffffff';
  s.size = 40;
  els.pad.value = 8;
  els.shadow.value = 0;
  els.outline.value = 0;
  els.outColor.value = '#ffffff';
  els.bSize.value = 40;
  els.fmt.value = 'png';
  setCompare(false);
  markBg(els.swatches.querySelector('button[data-bg="transparent"]'));
  setTool('bg');
  setPreset('original');
}

function init() {
  ['out', 'swatches', 'custom', 'grads', 'bgFile', 'blurBg', 'toolTabs', 'bEraser', 'bRestore', 'bUndo', 'bSize', 'presets', 'pad', 'shadow', 'outline', 'outColor', 'fmt', 'download', 'cmp', 'cmpCanvas', 'cmpBtn'].forEach(function (id) {
    els[id] = $(id);
  });

  els.swatches.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-bg]');
    if (!b) return;
    s.bg = b.dataset.bg;
    markBg(b);
    schedule();
  });

  els.custom.addEventListener('input', function () {
    s.bg = els.custom.value;
    markBg(null);
    schedule();
  });

  els.grads.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-g]');
    if (!b) return;
    s.bg = 'g:' + b.dataset.g;
    markBg(b);
    schedule();
  });

  els.blurBg.addEventListener('click', function () {
    s.bg = 'blur';
    markBg(els.blurBg);
    schedule();
  });

  els.bgFile.addEventListener('change', async function () {
    var f = els.bgFile.files[0];
    els.bgFile.value = '';
    if (!f) return;
    try {
      bgImg = await createImageBitmap(f, { imageOrientation: 'from-image' });
      s.bg = 'image';
      markBg($('bgUp'));
      schedule();
    } catch (err) {
      return;
    }
  });

  els.toolTabs.addEventListener('click', function (e) {
    var b = e.target.closest('.tt');
    if (b) setTool(b.dataset.tool);
  });

  els.presets.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-p]');
    if (b) setPreset(b.dataset.p);
  });

  els.pad.addEventListener('input', function () {
    s.pad = Number(els.pad.value);
    schedule();
  });

  els.shadow.addEventListener('input', function () {
    s.shadow = Number(els.shadow.value);
    schedule();
  });

  els.outline.addEventListener('input', function () {
    s.outline = Number(els.outline.value);
    schedule();
  });

  els.outColor.addEventListener('input', function () {
    s.outColor = els.outColor.value;
    schedule();
  });

  els.bEraser.addEventListener('click', function () { setBrush('erase'); });
  els.bRestore.addEventListener('click', function () { setBrush('restore'); });
  els.bUndo.addEventListener('click', doUndo);
  els.bSize.addEventListener('input', function () { s.size = Number(els.bSize.value); });

  els.out.addEventListener('pointerdown', onDown);
  els.out.addEventListener('pointermove', onMove);
  els.out.addEventListener('pointerup', onUp);
  els.out.addEventListener('pointercancel', onUp);

  els.cmpBtn.addEventListener('click', function () {
    if (!cut) return;
    setCompare(!cmpOn);
  });

  els.cmp.addEventListener('pointerdown', function (e) {
    cmpDrag = true;
    cancelAnimationFrame(cmpAnim);
    try { els.cmp.setPointerCapture(e.pointerId); } catch (err) {}
    cmpMove(e);
  });

  els.cmp.addEventListener('pointermove', function (e) {
    if (cmpDrag) cmpMove(e);
  });

  els.cmp.addEventListener('pointerup', function () { cmpDrag = false; });
  els.cmp.addEventListener('pointercancel', function () { cmpDrag = false; });

  els.download.addEventListener('click', download);
}

export function setSource(bmp, c) {
  orig = document.createElement('canvas');
  orig.width = bmp.width;
  orig.height = bmp.height;
  orig.getContext('2d').drawImage(bmp, 0, 0);
  cut = c;
  bbox = null;
  undo = [];
  render();
}

export function reset() {
  orig = null;
  cut = null;
  bbox = null;
  bgImg = null;
  undo = [];
  drawing = false;
  resetUI();
}

init();
