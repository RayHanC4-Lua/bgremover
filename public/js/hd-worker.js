import * as ort from '../vendor/ort/ort.wasm.min.mjs';

ort.env.wasm.wasmPaths = new URL('../vendor/ort/', import.meta.url).href;
ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.min(4, self.navigator.hardwareConcurrency || 1) : 1;

var session = null;

self.onmessage = async function (e) {
  var msg = e.data;
  try {
    if (msg.type === 'init') {
      session = await ort.InferenceSession.create(new Uint8Array(msg.buffer), {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
      self.postMessage({ type: 'ready' });
    } else if (msg.type === 'run') {
      var feeds = {};
      feeds[session.inputNames[0]] = new ort.Tensor('float32', msg.input, [1, 3, msg.h, msg.w]);
      var out = await session.run(feeds);
      var first = out[session.outputNames[0]];
      var dims = first.dims;
      var alpha = new Float32Array(first.data);
      self.postMessage({
        type: 'result',
        alpha: alpha,
        w: dims[dims.length - 1],
        h: dims[dims.length - 2]
      }, [alpha.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: String((err && err.message) || err) });
  }
};
