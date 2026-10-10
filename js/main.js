import { loadModel } from './model.js';
import { bitmapFromFile, toInput, buildCutout, compose } from './image.js';
import {
  els,
  setStatus,
  setProgress,
  setIndeterminate,
  hideStatus,
  showResult,
  showPicker,
  setActiveSwatch
} from './ui.js';

const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

let ready = null;
let pending = null;
let modelPromise = null;
let cutout = null;
let bg = 'transparent';

function defer() {
  let resolve;
  let reject;
  const promise = new Promise((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}

worker.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'ready' && ready) {
    ready.resolve();
  } else if (m.type === 'result' && pending) {
    pending.resolve(m.mask);
  } else if (m.type === 'error') {
    const err = new Error(m.message);
    if (pending) pending.reject(err);
    if (ready) ready.reject(err);
  }
};

worker.onerror = (e) => {
  const err = new Error(e.message || 'Worker gagal dimuat');
  if (pending) pending.reject(err);
  if (ready) ready.reject(err);
};

function ensureModel() {
  if (modelPromise) return modelPromise;
  modelPromise = (async () => {
    setStatus('Mengunduh model (sekali saja)...');
    setProgress(0);
    const buf = await loadModel('models/u2netp.onnx', setProgress);
    setStatus('Menyiapkan model...');
    setIndeterminate(true);
    ready = defer();
    worker.postMessage({ type: 'init', buffer: buf }, [buf]);
    await ready.promise;
  })();
  modelPromise.catch(() => {
    modelPromise = null;
  });
  return modelPromise;
}

function infer(input) {
  pending = defer();
  worker.postMessage({ type: 'run', input }, [input.buffer]);
  return pending.promise;
}

function render() {
  compose(cutout, bg, els.out);
}

async function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  try {
    els.drop.hidden = true;
    await ensureModel();
    setStatus('Memproses gambar...');
    setIndeterminate(true);
    const bmp = await bitmapFromFile(file);
    const mask = await infer(toInput(bmp));
    cutout = buildCutout(bmp, mask);
    bmp.close();
    render();
    hideStatus();
    showResult();
  } catch (err) {
    setIndeterminate(false);
    setStatus('Gagal: ' + err.message);
    els.drop.hidden = false;
  }
}

els.file.addEventListener('change', () => {
  handleFile(els.file.files[0]);
  els.file.value = '';
});

['dragenter', 'dragover'].forEach((t) => {
  els.drop.addEventListener(t, (e) => {
    e.preventDefault();
    els.drop.classList.add('over');
  });
});

['dragleave', 'drop'].forEach((t) => {
  els.drop.addEventListener(t, (e) => {
    e.preventDefault();
    els.drop.classList.remove('over');
  });
});

els.drop.addEventListener('drop', (e) => {
  handleFile(e.dataTransfer.files[0]);
});

els.swatches.addEventListener('click', (e) => {
  const b = e.target.closest('button[data-bg]');
  if (!b || !cutout) return;
  bg = b.dataset.bg;
  setActiveSwatch(b);
  render();
});

els.custom.addEventListener('input', () => {
  if (!cutout) return;
  bg = els.custom.value;
  setActiveSwatch(null);
  render();
});

els.download.addEventListener('click', () => {
  els.out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'hasil-' + Date.now() + '.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
});

els.reset.addEventListener('click', () => {
  cutout = null;
  bg = 'transparent';
  setActiveSwatch(els.swatches.querySelector('button[data-bg="transparent"]'));
  showPicker();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}
