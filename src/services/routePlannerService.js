// Route Planner Service: Geocoding (Photon/OSM) & Real-Road Cycling Routing (OSRM)
import { calculateHaversineKm } from './routesData';

const CUSTOM_ROUTES_KEY = 'merach_custom_routes_v1';

// Calculate bearing between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.cos((lon2 - lon1) * (Math.PI / 180));
  const b = Math.atan2(y, x) * (180 / Math.PI);
  return (b + 360) % 360;
}

// 1. Search places using Photon (Komoot) with fallback to OpenStreetMap Nominatim
export async function searchPlaces(query) {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim();

  // Try Photon (Komoot OSM Geocoder - Fast & CORS enabled)
  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=6&lang=pt`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.features && data.features.length > 0) {
        return data.features.map(f => {
          const props = f.properties || {};
          const coords = f.geometry?.coordinates || [0, 0];
          const parts = [props.name, props.street, props.city || props.town || props.county, props.country].filter(Boolean);
          const title = props.name || props.street || cleanQuery;
          const subtitle = parts.slice(1).join(', ') || props.country || '';
          return {
            id: `photon-${props.osm_id || Math.random()}`,
            name: title,
            description: subtitle,
            lat: coords[1],
            lng: coords[0]
          };
        });
      }
    }
  } catch (err) {
    console.warn('Photon geocode error, trying Nominatim fallback:', err);
  }

  // Fallback to Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&limit=6&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'pt-PT,pt;q=0.9,en;q=0.8' } });
    if (res.ok) {
      const data = await res.json();
      return (data || []).map(item => ({
        id: `nom-${item.place_id}`,
        name: item.name || item.display_name.split(',')[0],
        description: item.display_name.split(',').slice(1, 4).join(',').trim(),
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
    }
  } catch (err) {
    console.error('All geocoding fallbacks failed:', err);
  }

  return [];
}

// 2. Fetch Elevation Profile from Open-Meteo or interpolate
async function fetchElevations(coords) {
  if (!coords || coords.length === 0) return [];
  // Sample up to 80 points to respect API limits
  const step = Math.max(1, Math.floor(coords.length / 80));
  const sampledIndices = [];
  const lats = [];
  const lngs = [];

  for (let i = 0; i < coords.length; i += step) {
    sampledIndices.push(i);
    lats.push(coords[i][1].toFixed(4));
    lngs.push(coords[i][0].toFixed(4));
  }
  if (sampledIndices[sampledIndices.length - 1] !== coords.length - 1) {
    sampledIndices.push(coords.length - 1);
    lats.push(coords[coords.length - 1][1].toFixed(4));
    lngs.push(coords[coords.length - 1][0].toFixed(4));
  }

  try {
    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(',')}&longitude=${lngs.join(',')}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const elevations = data.elevation || [];
      // Interpolate elevations back to all coordinates
      const fullElevations = new Array(coords.length).fill(30);
      for (let s = 0; s < sampledIndices.length - 1; s++) {
        const idxStart = sampledIndices[s];
        const idxEnd = sampledIndices[s + 1];
        const eleStart = elevations[s] ?? 30;
        const eleEnd = elevations[s + 1] ?? eleStart;

        for (let i = idxStart; i <= idxEnd; i++) {
          const ratio = idxEnd > idxStart ? (i - idxStart) / (idxEnd - idxStart) : 0;
          fullElevations[i] = Math.round(eleStart + (eleEnd - eleStart) * ratio);
        }
      }
      return fullElevations;
    }
  } catch (err) {
    console.warn('Elevation API unavailable, using smooth terrain simulation:', err);
  }

  // Fallback: smooth undulating terrain simulation
  return coords.map((_, i) => Math.round(40 + Math.sin(i / 15) * 35 + Math.cos(i / 40) * 20));
}

// 3. Calculate Real Road Cycling Route using OSRM
export async function calculateRoute(start, end, customName = '') {
  if (!start?.lat || !start?.lng || !end?.lat || !end?.lng) {
    throw new Error('Ponto de partida e ponto de chegada obrigatórios.');
  }

  const profile = 'cycling'; // or 'driving'
  const primaryUrl = `https://router.project-osrm.org/route/v1/${profile}/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;
  const fallbackUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson&steps=true`;

  let routeData = null;

  try {
    const res = await fetch(primaryUrl);
    if (res.ok) {
      const json = await res.json();
      if (json.code === 'Ok' && json.routes && json.routes.length > 0) {
        routeData = json.routes[0];
      }
    }
  } catch (err) {
    console.warn('OSRM cycling profile failed, trying driving fallback:', err);
  }

  if (!routeData) {
    const res = await fetch(fallbackUrl);
    if (!res.ok) throw new Error('Não foi possível encontrar uma rota por estrada entre os dois pontos.');
    const json = await res.json();
    if (json.code !== 'Ok' || !json.routes || json.routes.length === 0) {
      throw new Error('Não foi possível traçar o caminho entre estas duas localizações.');
    }
    routeData = json.routes[0];
  }

  const rawCoords = routeData.geometry?.coordinates || [];
  if (rawCoords.length < 2) {
    throw new Error('Rota com poucos pontos de coordenadas.');
  }

  // Fetch elevation for route coordinates
  const elevations = await fetchElevations(rawCoords);

  // Build points array with distance, bearing and elevation
  const points = [];
  let cumulativeDistKm = 0;
  let totalEleGain = 0;

  for (let i = 0; i < rawCoords.length; i++) {
    const [lng, lat] = rawCoords[i];
    const ele = elevations[i] ?? 30;

    let bearing = 0;
    if (i < rawCoords.length - 1) {
      const [nextLng, nextLat] = rawCoords[i + 1];
      bearing = Math.round(calculateBearing(lat, lng, nextLat, nextLng));
    } else if (i > 0) {
      bearing = points[i - 1].bearing;
    }

    if (i > 0) {
      const prev = points[i - 1];
      const segKm = calculateHaversineKm(prev.lat, prev.lng, lat, lng);
      cumulativeDistKm += segKm;
      if (ele > prev.ele) {
        totalEleGain += (ele - prev.ele);
      }
    }

    points.push({
      lat,
      lng,
      ele: Math.round(ele),
      distanceKm: Number(cumulativeDistKm.toFixed(1)),
      bearing
    });
  }

  const totalDist = Number(cumulativeDistKm.toFixed(1));
  const elevationGain = Math.round(totalEleGain);
  const routeName = customName.trim() || `${start.name} ➔ ${end.name}`;

  const customRoute = {
    id: `route-${Date.now()}`,
    name: routeName,
    location: `${start.name} a ${end.name}`,
    distanceKm: totalDist,
    elevationGain,
    difficulty: elevationGain > 500 ? 'Difícil ⚡⚡' : elevationGain > 200 ? 'Média ⚡' : 'Fácil 🌱',
    gradientAvg: totalDist > 0 ? `${((elevationGain / (totalDist * 1000)) * 100).toFixed(1)}%` : '0%',
    isCustom: true,
    startName: start.name,
    endName: end.name,
    points
  };

  return customRoute;
}

// 4. LocalStorage Management for Custom Routes
export function getStoredCustomRoutes() {
  try {
    const raw = localStorage.getItem(CUSTOM_ROUTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading custom routes from storage:', err);
    return [];
  }
}

export function saveCustomRoute(newRoute) {
  try {
    const existing = getStoredCustomRoutes();
    const filtered = existing.filter(r => r.id !== newRoute.id);
    const updated = [newRoute, ...filtered];
    localStorage.setItem(CUSTOM_ROUTES_KEY, JSON.stringify(updated));
    syncRoutesToServer(updated);
    return updated;
  } catch (err) {
    console.error('Error saving custom route to storage:', err);
    return [];
  }
}

export function deleteCustomRoute(routeId) {
  try {
    const existing = getStoredCustomRoutes();
    const updated = existing.filter(r => r.id !== routeId);
    localStorage.setItem(CUSTOM_ROUTES_KEY, JSON.stringify(updated));
    syncRoutesToServer(updated);
    return updated;
  } catch (err) {
    console.error('Error deleting custom route:', err);
    return [];
  }
}

async function syncRoutesToServer(routes) {
  try {
    await fetch('/api/routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(routes)
    });
  } catch {
    // Graceful fallback
  }
}

export async function fetchServerCustomRoutes() {
  try {
    const res = await fetch('/api/routes');
    if (!res.ok) return null;
    const serverRoutes = await res.json();
    if (Array.isArray(serverRoutes) && serverRoutes.length > 0) {
      localStorage.setItem(CUSTOM_ROUTES_KEY, JSON.stringify(serverRoutes));
      return serverRoutes;
    }
    const local = getStoredCustomRoutes();
    if (Array.isArray(local) && local.length > 0) {
      syncRoutesToServer(local);
    }
    return local;
  } catch {
    return null;
  }
}
