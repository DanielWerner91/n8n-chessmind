// Stockfish Web Worker wrapper
// Loads stockfish-18-lite-single.js and communicates via postMessage

let engine = null;

self.importScripts('/stockfish.js');

self.onmessage = function (e) {
  const { type, payload } = e.data;

  if (type === 'init') {
    try {
      engine = STOCKFISH();
      engine.onmessage = function (msg) {
        self.postMessage({ type: 'uci', data: msg });
      };
      engine.postMessage('uci');
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', data: err.message });
    }
  } else if (type === 'cmd' && engine) {
    engine.postMessage(payload);
  } else if (type === 'quit' && engine) {
    engine.postMessage('quit');
    engine = null;
  }
};
