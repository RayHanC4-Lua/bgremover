import * as ort from '../vendor/ort/ort.wasm.min.mjs';

ort.env.wasm.wasmPaths = new URL('../vendor/ort/', import.meta.url).href;
ort.env.wasm.numThreads = 1;

var session = null;
var runCount = 0;
var lastErr;

self.onmessage = async function (e) {
  var msg = e.data;
  try {
    if (msg.type === 'init') {
      session = await ort.InferenceSession.create(new Uint8Array(msg.buffer), {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
      console.log('sesion ready');
      self.postMessage({ type: 'ready' });
    } else if (msg.type === 'run') {
      runCount++;
      var input = new ort.Tensor('float32', msg.input, [1, 3, 320, 320]);
      var feeds = {};
      feeds[session.inputNames[0]] = input;
      var out = await session.run(feeds);
      var first = out[session.outputNames[0]];
      var mask = new Float32Array(first.data);
      self.postMessage({ type: 'result', mask: mask }, [mask.buffer]);
    }
  } catch (err) {
    lastErr = err;
    self.postMessage({ type: 'error', message: String((err && err.message) || err) });
  }
};
