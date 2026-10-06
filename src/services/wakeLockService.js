// Screen Wake Lock & Background Audio Keep-Alive Service
// Keeps tablet / mobile screen awake during workouts and prevents OS background suspension

// Minimal valid silent PCM WAV audio (1-second 8kHz mono silence)
function generateSilentWavDataUri() {
  const sampleRate = 8000;
  const numSamples = sampleRate; // 1 second
  const buffer = new Uint8Array(44 + numSamples);
  const view = new DataView(buffer.buffer);

  // "RIFF" chunk
  buffer.set([0x52, 0x49, 0x46, 0x46], 0);
  view.setUint32(4, 36 + numSamples, true);
  // "WAVE" format
  buffer.set([0x57, 0x41, 0x56, 0x45], 8);
  // "fmt " subchunk
  buffer.set([0x66, 0x6d, 0x74, 0x20], 12);
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM format (1)
  view.setUint16(22, 1, true); // Mono (1 channel)
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate, true); // ByteRate (sampleRate * 1 channel * 1 byte/sample)
  view.setUint16(32, 1, true); // BlockAlign
  view.setUint16(34, 8, true); // 8 bits per sample
  // "data" subchunk
  buffer.set([0x64, 0x61, 0x74, 0x61], 36);
  view.setUint32(40, numSamples, true);

  // 128 is 0-level silence in 8-bit unsigned PCM
  buffer.fill(128, 44);

  let binary = '';
  const len = buffer.length;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

class WakeLockService {
  constructor() {
    this.sentinel = null;
    this.isWakeLockRequested = false;
    this.isAudioKeepAliveRequested = false;
    this.isWakeLockActive = false;
    this.audioElement = null;
    this.listeners = new Set();

    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Re-acquire wake lock automatically when returning to tab / turning screen on
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }
  }

  isWakeLockSupported() {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  async requestWakeLock() {
    this.isWakeLockRequested = true;
    if (!this.isWakeLockSupported()) {
      return false;
    }

    try {
      if (this.sentinel && !this.sentinel.released) {
        return true;
      }
      this.sentinel = await navigator.wakeLock.request('screen');
      this.isWakeLockActive = true;

      this.sentinel.addEventListener('release', () => {
        this.isWakeLockActive = false;
        this.notify();
      });

      this.notify();
      return true;
    } catch (err) {
      console.warn('[WakeLockService] Failed to acquire Screen Wake Lock:', err.name, err.message);
      this.isWakeLockActive = false;
      this.notify();
      return false;
    }
  }

  async releaseWakeLock() {
    this.isWakeLockRequested = false;
    if (this.sentinel) {
      try {
        await this.sentinel.release();
      } catch {
        // Ignore release errors
      }
      this.sentinel = null;
    }
    this.isWakeLockActive = false;
    this.notify();
  }

  enableBackgroundAudio() {
    this.isAudioKeepAliveRequested = true;
    if (typeof window === 'undefined') return;

    try {
      if (!this.audioElement) {
        const audio = document.createElement('audio');
        audio.src = generateSilentWavDataUri();
        audio.loop = true;
        audio.playsInline = true;
        audio.setAttribute('playsinline', '');
        audio.setAttribute('webkit-playsinline', '');
        audio.volume = 0.01;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        this.audioElement = audio;
      }

      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Play requires user interaction gesture in some browsers
          console.debug('[WakeLockService] Audio keep-alive pending user gesture:', err.message);
        });
      }
    } catch (err) {
      console.warn('[WakeLockService] Audio keep-alive error:', err);
    }
  }

  disableBackgroundAudio() {
    this.isAudioKeepAliveRequested = false;
    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch {
        // Ignore
      }
    }
  }

  async handleVisibilityChange() {
    if (typeof document === 'undefined') return;

    if (document.visibilityState === 'visible') {
      // Tab is foregrounded / screen woke up! Re-request wake lock if requested
      if (this.isWakeLockRequested) {
        await this.requestWakeLock();
      }
      if (this.isAudioKeepAliveRequested && this.audioElement) {
        this.audioElement.play().catch(() => {});
      }
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback({
      isWakeLockActive: this.isWakeLockActive,
      isSupported: this.isWakeLockSupported(),
      isRequested: this.isWakeLockRequested
    });
    return () => this.listeners.delete(callback);
  }

  notify() {
    const state = {
      isWakeLockActive: this.isWakeLockActive,
      isSupported: this.isWakeLockSupported(),
      isRequested: this.isWakeLockRequested
    };
    for (const cb of this.listeners) {
      try {
        cb(state);
      } catch (err) {
        console.error('[WakeLockService] Listener error:', err);
      }
    }
  }
}

export const wakeLockService = new WakeLockService();
