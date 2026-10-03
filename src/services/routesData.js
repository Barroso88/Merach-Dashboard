// Preset Real Cycling Routes and GPX Parser for Merach Cycling Dashboard

// 1. Cascais to Guincho Coastline (Flat / Coastal scenic ride)
function generateCoastRoute() {
  const baseLat = 38.6970;
  const baseLng = -9.4215;
  const points = [];
  const totalKm = 14.5;
  const count = 120;

  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const dist = progress * totalKm;
    // Follow shoreline westward then northward towards Guincho
    const angle = progress * 1.2;
    const lat = baseLat + (progress * 0.035) + Math.sin(progress * 4) * 0.005;
    const lng = baseLng - (progress * 0.055) + Math.cos(progress * 3) * 0.004;
    // Sea level gently undulating between 5m and 35m
    const elevation = 10 + Math.sin(progress * 8) * 12 + (progress * 15);

    points.push({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      ele: Math.max(2, Math.round(elevation)),
      distanceKm: Number(dist.toFixed(2))
    });
  }
  return points;
}

// 2. Serra da Estrela - Subida mítica à Torre (Portugal High Mountain Climb)
function generateTorreRoute() {
  const baseLat = 40.4022; // Manteigas
  const baseLng = -7.5385;
  const points = [];
  const totalKm = 18.2;
  const count = 140;

  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const dist = progress * totalKm;
    // Winding mountain switchbacks
    const switchback = Math.sin(progress * 18) * 0.009;
    const lat = baseLat - (progress * 0.08) + switchback;
    const lng = baseLng - (progress * 0.07) + Math.cos(progress * 14) * 0.007;
    // Climb from 750m in Manteigas to 1993m at Torre
    const climbCurve = Math.pow(progress, 0.95);
    const elevation = 750 + climbCurve * 1243;

    points.push({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      ele: Math.round(elevation),
      distanceKm: Number(dist.toFixed(2))
    });
  }
  return points;
}

// 3. Alpe d'Huez - As 21 Curvas Míticas (França)
function generateAlpeHuezRoute() {
  const baseLat = 45.0503; // Le Bourg-d'Oisans
  const baseLng = 6.0270;
  const points = [];
  const totalKm = 13.8;
  const count = 150;

  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const dist = progress * totalKm;
    // Intense 21 hairpin switchbacks
    const hairpins = Math.sin(progress * 42) * 0.007;
    const lat = baseLat + (progress * 0.045) + hairpins;
    const lng = baseLng + (progress * 0.055) + Math.cos(progress * 42) * 0.006;
    // Climb from 740m to 1860m
    const elevation = 740 + progress * 1120;

    points.push({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      ele: Math.round(elevation),
      distanceKm: Number(dist.toFixed(2))
    });
  }
  return points;
}

// 4. Monsanto Forest Park - Lisboa (Rollercoaster hills)
function generateMonsantoRoute() {
  const baseLat = 38.7300;
  const baseLng = -9.1900;
  const points = [];
  const totalKm = 9.8;
  const count = 90;

  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const dist = progress * totalKm;
    // Circuit around the park
    const angle = progress * Math.PI * 2;
    const lat = baseLat + Math.sin(angle) * 0.018;
    const lng = baseLng + Math.cos(angle) * 0.022;
    // Rolling hills between 90m and 225m
    const elevation = 120 + Math.sin(progress * 12) * 65;

    points.push({
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      ele: Math.round(elevation),
      distanceKm: Number(dist.toFixed(2))
    });
  }
  return points;
}

export const PRESET_ROUTES = [
  {
    id: 'cascais-guincho',
    name: 'Marginal Cascais - Guincho',
    location: 'Cascais, Portugal',
    distanceKm: 14.5,
    elevationGain: 125,
    difficulty: 'Fácil / Panorâmica',
    gradientAvg: '1.2%',
    points: generateCoastRoute()
  },
  {
    id: 'serra-estrela',
    name: 'Subida à Torre (Serra da Estrela)',
    location: 'Manteigas ➔ Torre, Portugal',
    distanceKm: 18.2,
    elevationGain: 1243,
    difficulty: 'Muito Difícil / Hors Catégorie',
    gradientAvg: '7.1%',
    points: generateTorreRoute()
  },
  {
    id: 'monsanto-hills',
    name: 'Pulmão Verde de Monsanto',
    location: 'Lisboa, Portugal',
    distanceKm: 9.8,
    elevationGain: 280,
    difficulty: 'Média / Ondulado',
    gradientAvg: '3.4%',
    points: generateMonsantoRoute()
  },
  {
    id: 'alpe-dhuez',
    name: "Alpe d'Huez (21 Curvas)",
    location: 'Alpes Franceses, França',
    distanceKm: 13.8,
    elevationGain: 1120,
    difficulty: 'Mítica / Alta Montanha',
    gradientAvg: '8.1%',
    points: generateAlpeHuezRoute()
  }
];

// Helper: Haversine distance in km between 2 coordinates
export function calculateHaversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Parse XML/GPX text into structured route format
export function parseGpxRoute(gpxString, fileName = 'Rota Personalizada') {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxString, 'text/xml');
    const trkpts = xmlDoc.getElementsByTagName('trkpt');

    if (!trkpts || trkpts.length === 0) {
      throw new Error('O ficheiro GPX não contém pontos de trajeto (<trkpt>).');
    }

    const points = [];
    let cumulativeDist = 0;
    let elevationGain = 0;
    let prevEle = null;

    for (let i = 0; i < trkpts.length; i++) {
      const pt = trkpts[i];
      const lat = parseFloat(pt.getAttribute('lat'));
      const lng = parseFloat(pt.getAttribute('lon'));
      const eleNode = pt.getElementsByTagName('ele')[0];
      const ele = eleNode ? parseFloat(eleNode.textContent) : 0;

      if (i > 0) {
        const prev = points[i - 1];
        const segDist = calculateHaversineKm(prev.lat, prev.lng, lat, lng);
        cumulativeDist += segDist;

        if (prevEle !== null && ele > prevEle) {
          elevationGain += (ele - prevEle);
        }
      }

      prevEle = ele;

      points.push({
        lat,
        lng,
        ele: Math.round(ele),
        distanceKm: Number(cumulativeDist.toFixed(2))
      });
    }

    const routeName = xmlDoc.getElementsByTagName('name')[0]?.textContent || fileName.replace(/\.gpx$/i, '');

    return {
      id: `custom-gpx-${Date.now()}`,
      name: routeName,
      location: 'Ficheiro GPX Carregado',
      distanceKm: Number(cumulativeDist.toFixed(2)),
      elevationGain: Math.round(elevationGain),
      difficulty: elevationGain > 800 ? 'Difícil' : elevationGain > 300 ? 'Média' : 'Fácil',
      gradientAvg: cumulativeDist > 0 ? `${((elevationGain / (cumulativeDist * 1000)) * 100).toFixed(1)}%` : '0%',
      points
    };
  } catch (err) {
    console.error('Error parsing GPX:', err);
    throw err;
  }
}

// Calculate interpolated current rider position along the route for a given distance in km
export function getRiderPositionAlongRoute(route, coveredKm) {
  if (!route || !route.points || route.points.length === 0) return null;

  const points = route.points;
  const totalRouteKm = route.distanceKm || points[points.length - 1].distanceKm;
  
  // Modulo loop for laps if workout is longer than route
  const currentKm = coveredKm % totalRouteKm;
  const lapNumber = Math.floor(coveredKm / totalRouteKm) + 1;
  const isFinished = coveredKm >= totalRouteKm;

  // Find surrounding segment points
  let idx = 0;
  while (idx < points.length - 1 && points[idx + 1].distanceKm <= currentKm) {
    idx++;
  }

  const p1 = points[idx];
  const p2 = points[Math.min(idx + 1, points.length - 1)];

  // Segment interpolation fraction
  const segDist = p2.distanceKm - p1.distanceKm;
  const ratio = segDist > 0 ? Math.min(1, Math.max(0, (currentKm - p1.distanceKm) / segDist)) : 0;

  const currentLat = p1.lat + (p2.lat - p1.lat) * ratio;
  const currentLng = p1.lng + (p2.lng - p1.lng) * ratio;
  const currentEle = Math.round(p1.ele + (p2.ele - p1.ele) * ratio);

  // Gradient (% slope) over the next 150m segment
  const eleDiff = p2.ele - p1.ele;
  const distDiffMeters = segDist * 1000;
  const gradient = distDiffMeters > 5 ? Number(((eleDiff / distDiffMeters) * 100).toFixed(1)) : 0;

  // Bearing / heading angle in degrees (0 = North, 90 = East, etc.)
  const y = Math.sin((p2.lng - p1.lng) * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180));
  const x = Math.cos(p1.lat * (Math.PI / 180)) * Math.sin(p2.lat * (Math.PI / 180)) -
            Math.sin(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) * Math.cos((p2.lng - p1.lng) * (Math.PI / 180));
  const bearing = (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;

  return {
    lat: currentLat,
    lng: currentLng,
    ele: currentEle,
    gradient,
    bearing,
    progressPercent: Math.min(100, Number(((currentKm / totalRouteKm) * 100).toFixed(1))),
    remainingKm: Number(Math.max(0, totalRouteKm - currentKm).toFixed(2)),
    lapNumber,
    isFinished
  };
}
