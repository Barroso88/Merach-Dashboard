// Web Worker based high-precision background timer
// Prevents browser throttling of setInterval when tab is in background or screen is off

export class WorkerTimer {
  constructor() {
    this.worker = null;
    this.fallbackTimer = null;
    this.callbacks = new Set();
    this.intervalMs = 500;
    this.isRunning = false;
    this.init();
  }

  init() {
    try {
      if (typeof window !== 'undefined' && window.Worker && window.Blob && window.URL) {
        const workerCode = `
          let timerId = null;
          self.onmessage = function(e) {
            if (e.data && e.data.action === 'start') {
              if (timerId) clearInterval(timerId);
              const interval = e.data.interval || 500;
              timerId = setInterval(function() {
                self.postMessage({ type: 'tick', timestamp: Date.now() });
              }, interval);
            } else if (e.data && e.data.action === 'stop') {
              if (timerId) clearInterval(timerId);
              timerId = null;
            }
          };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        this.worker = new Worker(url);
        this.worker.onmessage = (e) => {
          if (e.data && e.data.type === 'tick') {
            this.notify(e.data.timestamp);
          }
        };
      }
    } catch (e) {
      console.warn('[WorkerTimer] Web Worker not available, falling back to window.setInterval', e);
      this.worker = null;
    }
  }

  start(intervalMs = 500, callback) {
    this.intervalMs = intervalMs;
    this.isRunning = true;
    if (callback) this.callbacks.add(callback);

    if (this.worker) {
      this.worker.postMessage({ action: 'start', interval: intervalMs });
    } else {
      if (this.fallbackTimer) clearInterval(this.fallbackTimer);
      this.fallbackTimer = setInterval(() => {
        this.notify(Date.now());
      }, intervalMs);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.worker) {
      this.worker.postMessage({ action: 'stop' });
    }
    if (this.fallbackTimer) {
      clearInterval(this.fallbackTimer);
      this.fallbackTimer = null;
    }
  }

  subscribe(callback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  notify(timestamp) {
    for (const cb of this.callbacks) {
      try {
        cb(timestamp);
      } catch (err) {
        console.error('[WorkerTimer] Error in callback:', err);
      }
    }
  }

  destroy() {
    this.stop();
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.callbacks.clear();
  }
}

export const globalWorkerTimer = new WorkerTimer();
