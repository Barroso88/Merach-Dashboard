// Dynamic Multi-CDN Loader for MapLibre GL JS (WebGL 3D Engine for Satellite Navigation)

let maplibrePromise = null;

const CDNS = [
  {
    js: 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js',
    css: 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'
  },
  {
    js: 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js',
    css: 'https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css'
  },
  {
    js: 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.js',
    css: 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.css'
  }
];

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing) {
      if (window.maplibregl) return resolve(window.maplibregl);
      existing.addEventListener('load', () => resolve(window.maplibregl));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.async = true;
    script.onload = () => {
      if (window.maplibregl) {
        resolve(window.maplibregl);
      } else {
        reject(new Error(`window.maplibregl undefined after loading ${url}`));
      }
    };
    script.onerror = () => reject(new Error(`Failed to load ${url}`));
    document.head.appendChild(script);
  });
}

function injectCss(url) {
  if (!document.querySelector(`link[href="${url}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }
}

export function loadMapLibre() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not available'));
  }

  if (window.maplibregl) {
    return Promise.resolve(window.maplibregl);
  }

  if (maplibrePromise) {
    return maplibrePromise;
  }

  maplibrePromise = (async () => {
    let lastError = null;
    for (const cdn of CDNS) {
      try {
        injectCss(cdn.css);
        const maplibregl = await loadScript(cdn.js);
        if (maplibregl) return maplibregl;
      } catch (err) {
        console.warn(`MapLibre load attempt from ${cdn.js} failed:`, err);
        lastError = err;
      }
    }
    maplibrePromise = null;
    throw lastError || new Error('All MapLibre CDNs failed to load');
  })();

  return maplibrePromise;
}
