// Dynamic Loader for MapLibre GL JS (WebGL 3D Engine for Satellite Navigation)

let maplibrePromise = null;

export function loadMapLibre() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not available'));
  }

  if (window.maplibregl) {
    return Promise.resolve(window.maplibregl);
  }

  if (maplibrePromise) {
    return maplibrePromise;
  }

  maplibrePromise = new Promise((resolve, reject) => {
    // 1. Inject CSS if not already present
    if (!document.getElementById('maplibre-gl-css')) {
      const link = document.createElement('link');
      link.id = 'maplibre-gl-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }

    // 2. Check if script tag already exists
    const existing = document.getElementById('maplibre-gl-js');
    if (existing) {
      if (window.maplibregl) {
        resolve(window.maplibregl);
      } else {
        existing.addEventListener('load', () => resolve(window.maplibregl));
        existing.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    // 3. Inject JS
    const script = document.createElement('script');
    script.id = 'maplibre-gl-js';
    script.type = 'text/javascript';
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
    script.async = true;

    script.onload = () => {
      if (window.maplibregl) {
        resolve(window.maplibregl);
      } else {
        reject(new Error('MapLibre GL object missing after script load'));
      }
    };

    script.onerror = (err) => {
      maplibrePromise = null;
      console.error('Error loading MapLibre GL JS:', err);
      reject(new Error('Failed to load MapLibre GL JS from CDN'));
    };

    document.head.appendChild(script);
  });

  return maplibrePromise;
}
