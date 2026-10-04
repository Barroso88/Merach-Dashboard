// Dynamic loader for Google Maps JavaScript API

let googleMapsPromise = null;
let googleMapsLoaded = false;
let authErrorDetected = false;

// Global listener for Google Maps authentication failures
if (typeof window !== 'undefined') {
  window.gm_authFailure = () => {
    console.error('Google Maps API authentication failed (check API key or enabled APIs in Google Cloud Console).');
    authErrorDetected = true;
    window.dispatchEvent(new CustomEvent('google-maps-auth-error', {
      detail: { message: 'Falha na autenticação da chave Google Maps API.' }
    }));
  };
}

export function hasGoogleMapsAuthError() {
  return authErrorDetected;
}

export function isGoogleMapsLoaded() {
  return Boolean(typeof window !== 'undefined' && window.google && window.google.maps);
}

export function loadGoogleMaps(apiKey) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is not defined'));
  }

  // Already loaded
  if (window.google && window.google.maps) {
    googleMapsLoaded = true;
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const keyToUse = (apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

  if (!keyToUse) {
    return Promise.reject(new Error('Nenhuma chave de API Google Maps configurada.'));
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if script element already exists
    const existing = document.getElementById('google-maps-sdk-script');
    if (existing) {
      if (window.google?.maps) {
        googleMapsLoaded = true;
        resolve(window.google.maps);
      } else {
        existing.addEventListener('load', () => {
          googleMapsLoaded = true;
          resolve(window.google.maps);
        });
        existing.addEventListener('error', (e) => reject(e));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-sdk-script';
    script.type = 'text/javascript';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(keyToUse)}&libraries=geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleMapsLoaded = true;
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps script carregado sem objeto maps.'));
      }
    };

    script.onerror = (err) => {
      googleMapsPromise = null;
      console.error('Erro ao descarregar Google Maps script:', err);
      reject(new Error('Falha de rede ao descarregar Google Maps API.'));
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}
