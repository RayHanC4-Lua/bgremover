import { loadModel } from './model.js';
import { bitmapFromFile, toInput, buildCutout, compose } from './image.js';
import { els, setStatus, setProgress, setIndeterminate, hideStatus, showResult, showPicker, setActiveSwatch } from './ui.js';

var worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

var ready = null;
var pendng = null;
var modelPromise = null;
var cutout = null;
var bg = 'transparent';
var firstRun = true;
var fileCount = 0;
var lastResutl = null;

function defer() {
  var resolve, reject;
  var promise = new Promise(function (a, b) { resolve = a; reject = b; });
  return { promise: promise, resolve: resolve, reject: reject };
}

worker.onmessage = function (e) {
  var m = e.data;
  if (m.type === 'ready' && ready) {
    ready.resolve();
  } else if (m.type === 'result' && pendng) {
    pendng.resolve(m.mask);
  } else if (m.type === 'error') {
    var err = new Error(m.message);
    if (pendng) pendng.reject(err);
    if (ready) ready.reject(err);
  }
};

worker.onerror = function (e) {
  var err = new Error(e.message || 'Worker failed to load');
  if (pendng) pendng.reject(err);
  if (ready) ready.reject(err);
};

function ensureModel() {
  if (modelPromise) return modelPromise;
  modelPromise = (async function () {
    setStatus('Downloading model (one time only)...');
    setProgress(0);
    var buf = await loadModel('models/u2netp.onnx', setProgress);
    setStatus('Preparing model...');
    setIndeterminate(true);
    ready = defer();
    worker.postMessage({ type: 'init', buffer: buf }, [buf]);
    await ready.promise;
  })();
  modelPromise.catch(function () {
    modelPromise = null;
  });
  return modelPromise;
}

function infer(input) {
  pendng = defer();
  worker.postMessage({ type: 'run', input: input }, [input.buffer]);
  return pendng.promise;
}

function render() {
  compose(cutout, bg, els.out);
}

function oldReset() {
  cutout = null;
  bg = 'transparent';
}

async function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  fileCount++;
  if (firstRun) { console.log('first run'); }
  try {
    els.drop.hidden = true;
    await ensureModel();
    setStatus('Processing image...');
    setIndeterminate(true);
    var bmp = await bitmapFromFile(file);
    var mask = await infer(toInput(bmp));
    cutout = buildCutout(bmp, mask);
    lastResutl = cutout;
    bmp.close();
    render();
    hideStatus();
    showResult();
    firstRun = false;
  } catch (err) {
    setIndeterminate(false);
    setStatus('Failed: ' + err.message);
    els.drop.hidden = false;
  }
}

els.file.addEventListener('change', function () {
  handleFile(els.file.files[0]);
  els.file.value = '';
});

['dragenter', 'dragover'].forEach(function (t) {
  els.drop.addEventListener(t, function (e) {
    e.preventDefault();
    els.drop.classList.add('over');
  });
});

['dragleave', 'drop'].forEach(function (t) {
  els.drop.addEventListener(t, function (e) {
    e.preventDefault();
    els.drop.classList.remove('over');
  });
});

els.drop.addEventListener('drop', function (e) {
  handleFile(e.dataTransfer.files[0]);
});

els.swatches.addEventListener('click', function (e) {
  var b = e.target.closest('button[data-bg]');
  if (!b || !cutout) return;
  bg = b.dataset.bg;
  setActiveSwatch(b);
  render();
});

els.custom.addEventListener("input", function () {
  if (!cutout) return;
  bg = els.custom.value;
  setActiveSwatch(null);
  render();
});

els.download.addEventListener('click', function () {
  els.out.toBlob(function (blob) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'result-' + Date.now() + '.png';
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }, 'image/png');
});

els.reset.addEventListener('click', function () {
  cutout = null;
  bg = 'transparent';
  setActiveSwatch(els.swatches.querySelector('button[data-bg="transparent"]'));
  showPicker();
});

window.addEventListener('paste', function (e) {
  var items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      handleFile(items[i].getAsFile());
      break;
    }
  }
});

['dragover', 'drop'].forEach(function (t) {
  window.addEventListener(t, function (e) { e.preventDefault(); });
});

var samplePaths = [
  'assets/samples/sample-1.jpg',
  'assets/samples/sample-2.jpg',
  'assets/samples/sample-3.jpg'
];

(async function () {
  var box = document.getElementById('samples');
  var thumbs = document.getElementById('thumbs');
  for (var i = 0; i < samplePaths.length; i++) {
    try {
      var res = await fetch(samplePaths[i]);
      var type = res.headers.get('content-type') || '';
      if (!res.ok || !type.startsWith('image/')) continue;
      var blob = await res.blob();
      var img = document.createElement('img');
      img.src = URL.createObjectURL(blob);
      img.alt = 'Sample image';
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'thumb';
      b.appendChild(img);
      b.addEventListener('click', (function (bl) {
        return function () { handleFile(new File([bl], 'sample', { type: bl.type })); };
      })(blob));
      thumbs.appendChild(b);
    } catch (e) {
      continue;
    }
  }
  if (thumbs.children.length) box.hidden = false;
})();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js');
  });
}
