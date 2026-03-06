/**
 * Stockfish WASM client — singleton wrapper around the Web Worker.
 * Provides promise-based position evaluation.
 */

type EvalResult = {
  score: number; // centipawns from white's perspective
  bestMove: string;
  depth: number;
};

let worker: Worker | null = null;
let isReady = false;
let messageQueue: ((msg: string) => void)[] = [];

function getWorker(): Promise<Worker> {
  return new Promise((resolve, reject) => {
    if (worker && isReady) {
      resolve(worker);
      return;
    }

    if (worker) {
      // Already initializing, wait for ready
      const check = setInterval(() => {
        if (isReady) {
          clearInterval(check);
          resolve(worker!);
        }
      }, 100);
      return;
    }

    try {
      worker = new Worker('/stockfish-worker.js');
      worker.onmessage = (e) => {
        const { type, data } = e.data;
        if (type === 'ready') {
          isReady = true;
          resolve(worker!);
        } else if (type === 'uci') {
          // Dispatch to all listeners
          for (const cb of messageQueue) {
            cb(data);
          }
        } else if (type === 'error') {
          reject(new Error(data));
        }
      };
      worker.postMessage({ type: 'init' });
    } catch (err) {
      reject(err);
    }
  });
}

export async function evaluateFen(fen: string, depth = 18): Promise<EvalResult> {
  const w = await getWorker();

  return new Promise((resolve) => {
    let bestMove = '';
    let score = 0;
    let finalDepth = 0;

    const handler = (msg: string) => {
      if (typeof msg !== 'string') return;

      // Parse "info depth X score cp Y" lines
      const infoMatch = msg.match(/info depth (\d+).*score (cp|mate) (-?\d+)/);
      if (infoMatch) {
        finalDepth = parseInt(infoMatch[1]);
        if (infoMatch[2] === 'cp') {
          score = parseInt(infoMatch[3]);
        } else {
          // mate score: convert to large cp value
          const mateIn = parseInt(infoMatch[3]);
          score = mateIn > 0 ? 10000 - mateIn : -10000 - mateIn;
        }
      }

      // Parse "bestmove" line
      if (msg.startsWith('bestmove')) {
        const parts = msg.split(' ');
        bestMove = parts[1] || '';
        // Remove handler
        const idx = messageQueue.indexOf(handler);
        if (idx !== -1) messageQueue.splice(idx, 1);
        resolve({ score, bestMove, depth: finalDepth });
      }
    };

    messageQueue.push(handler);
    w.postMessage({ type: 'cmd', payload: 'position fen ' + fen });
    w.postMessage({ type: 'cmd', payload: 'go depth ' + depth });
  });
}

export function terminate() {
  if (worker) {
    worker.postMessage({ type: 'quit' });
    worker.terminate();
    worker = null;
    isReady = false;
    messageQueue = [];
  }
}
