import * as ort from '../vendor/ort/ort.wasm.min.mjs';

ort.env.wasm.wasmPaths = new URL('../vendor/ort/', import.meta.url).href;
ort.env.wasm.numThreads = 1;

let session = null;

self.onmessage = async (e) => {
  const msg = e.data;
  try {
    if (msg.type === 'init') {
      session = await ort.InferenceSession.create(new Uint8Array(msg.buffer), {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all'
      });
      self.postMessage({ type: 'ready' });
    } else if (msg.type === 'run') {
      const input = new ort.Tensor('float32', msg.input, [1, 3, 320, 320]);
      const feeds = {};
      feeds[session.inputNames[0]] = input;
      const out = await session.run(feeds);
      const mask = new Float32Array(out[session.outputNames[0]].data);
      self.postMessage({ type: 'result', mask }, [mask.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: String((err && err.message) || err) });
  }
};
