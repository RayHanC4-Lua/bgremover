import { loadModel } from './model.js';
import { bitmapFromFile, toInput, buildCutout } from './image.js';
import * as Tools from './tools.js';
import { runHD } from './hd.js';
import { els, setStatus, setProgress, setIndeterminate, hideStatus, showResult, showPicker } from './ui.js';

var worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

var ready = null;
var pendng = null;
var modelPromise = null;
var cutout = null;
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

var hdBox = document.getElementById('hdMode');

function hdStatus(t) {
  setStatus(t);
  if (t.indexOf('Downloading') === 0) {
    setProgress(0);
  } else {
    setIndeterminate(true);
  }
}

async function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  fileCount++;
  if (firstRun) { console.log('first run'); }
  var bmp = null;
  try {
    els.drop.hidden = true;
    bmp = await bitmapFromFile(file);
    var done = false;
    if (hdBox && hdBox.checked) {
      try {
        cutout = await runHD(bmp, hdStatus, setProgress);
        done = true;
      } catch (err) {
        console.log('hd failed', err);
        setStatus('Portrait HD failed, switching to standard mode...');
      }
    }
    if (!done) {
      await ensureModel();
      setStatus('Processing image...');
      setIndeterminate(true);
      var mask = await infer(toInput(bmp));
      cutout = buildCutout(bmp, mask);
    }
    lastResutl = cutout;
    Tools.reset();
    Tools.setSource(bmp, cutout);
    bmp.close();
    hideStatus();
    showResult();
    firstRun = false;
  } catch (err) {
    if (bmp) bmp.close();
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

els.reset.addEventListener('click', function () {
  cutout = null;
  Tools.reset();
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


(function () {
  var row = document.getElementById('hdRow');
  if (!row) return;
  fetch('models/modnet.onnx', { method: 'HEAD' })
    .then(function (r) {
      var type = r.headers.get('content-type') || '';
      if (r.ok && type.indexOf('text/html') === -1) row.hidden = false;
    })
    .catch(function () {});
})();
