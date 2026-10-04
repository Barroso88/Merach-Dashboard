import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Compass,
  Layers,
  Car,
  MapPin,
  TrendingUp,
  TrendingDown,
  Mountain,
  Navigation2
} from 'lucide-react';
import { loadMapLibre } from '../services/maplibreLoader';

const ESRI_SATELLITE_STYLE = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '&copy; Esri World Imagery'
    }
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

const ESRI_STREET_STYLE = {
  version: 8,
  sources: {
    'esri-street': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: '&copy; Esri World Street Map'
    }
  },
  layers: [
    {
      id: 'esri-street-layer',
      type: 'raster',
      source: 'esri-street',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

export default function CarView3DMap({
  currentRoute,
  riderPos,
  speedKmH = 0,
  currentDistanceKm = 0,
  isRose = false,
  primaryColor = '#38bdf8',
  isFrontalView: isFrontalViewProp,
  onToggleFrontalView
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const startMarkerRef = useRef(null);
  const finishMarkerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [mapStyleType, setMapStyleType] = useState('satellite'); // 'satellite' | 'street'
  const [internalFrontalView, setInternalFrontalView] = useState(true);
  const isFrontalView = isFrontalViewProp !== undefined ? isFrontalViewProp : internalFrontalView;
  const [zoomLevel, setZoomLevel] = useState(17.5);

  const handleToggleFrontalView = () => {
    if (onToggleFrontalView) {
      onToggleFrontalView(!isFrontalView);
    } else {
      setInternalFrontalView(!internalFrontalView);
    }
  };

  const isPedaling = speedKmH > 1;

  // Initialize MapLibre 3D WebGL Map
  useEffect(() => {
    let isCancelled = false;

    if (!containerRef.current || !currentRoute?.points?.length) return;

    const initMap = async () => {
      try {
        const maplibregl = await loadMapLibre();
        if (isCancelled || !containerRef.current) return;

        const initialPoint = currentRoute.points[0] || { lng: -9.4215, lat: 38.6970 };
        const initialBearing = currentRoute.points[0]?.bearing || 0;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: mapStyleType === 'street' ? ESRI_STREET_STYLE : ESRI_SATELLITE_STYLE,
          center: [initialPoint.lng, initialPoint.lat],
          zoom: 17.5,
          pitch: isFrontalView ? 62 : 0, // 62° 3D forward tilt like a car windshield!
          bearing: isFrontalView ? initialBearing : 0,
          attributionControl: false,
          maxPitch: 75
        });

        map.on('load', () => {
          if (isCancelled) return;

          // 1. Add Full Route Line GeoJSON
          map.addSource('route-full', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: currentRoute.points.map(p => [p.lng, p.lat])
              }
            }
          });

          // Outer Glow
          map.addLayer({
            id: 'route-full-glow',
            type: 'line',
            source: 'route-full',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': isRose ? '#ff2d75' : '#38bdf8',
              'line-width': 10,
              'line-opacity': 0.35,
              'line-blur': 4
            }
          });

          // Base Dashed Road Track
          map.addLayer({
            id: 'route-full-track',
            type: 'line',
            source: 'route-full',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#0f172a',
              'line-width': 6,
              'line-opacity': 0.85
            }
          });

          // 2. Add Covered Track GeoJSON
          map.addSource('route-covered', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: [[initialPoint.lng, initialPoint.lat]]
              }
            }
          });

          map.addLayer({
            id: 'route-covered-track',
            type: 'line',
            source: 'route-covered',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': primaryColor,
              'line-width': 7,
              'line-opacity': 0.95
            }
          });

          // 3. Start Marker
          const startEl = document.createElement('div');
          startEl.innerHTML = `
            <div style="background: #10b981; color: black; font-weight: 900; font-size: 11px; padding: 4px 10px; border-radius: 9999px; box-shadow: 0 0 15px rgba(16,185,129,0.9); border: 2px solid white; display: flex; align-items: center; gap: 4px; transform: translate(-50%, -50%);">
              <span>🚦</span> Partida
            </div>
          `;
          startMarkerRef.current = new maplibregl.Marker({ element: startEl })
            .setLngLat([initialPoint.lng, initialPoint.lat])
            .addTo(map);

          // 4. Finish Marker
          const finishPoint = currentRoute.points[currentRoute.points.length - 1];
          const finishEl = document.createElement('div');
          finishEl.innerHTML = `
            <div style="background: #f43f5e; color: white; font-weight: 900; font-size: 11px; padding: 4px 10px; border-radius: 9999px; box-shadow: 0 0 15px rgba(244,63,94,0.9); border: 2px solid white; display: flex; align-items: center; gap: 4px; transform: translate(-50%, -50%);">
              <span>🏁</span> Meta (${currentRoute.distanceKm} km)
            </div>
          `;
          finishMarkerRef.current = new maplibregl.Marker({ element: finishEl })
            .setLngLat([finishPoint.lng, finishPoint.lat])
            .addTo(map);

          // 5. Cyclist Marker (Animated GIF)
          const cyclistEl = document.createElement('div');
          cyclistEl.className = 'cyclist-marker-root';
          cyclistEl.innerHTML = `
            <div style="position: relative; width: 68px; height: 68px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%);">
              <!-- Pulsing Halo -->
              <div id="cyclist-halo" style="position: absolute; width: 56px; height: 56px; border-radius: 50%; background: ${primaryColor}; opacity: 0.3; transition: all 0.3s;"></div>
              
              <!-- Circular Cockpit Frame -->
              <div style="position: relative; width: 50px; height: 50px; border-radius: 50%; background: rgba(8, 12, 20, 0.95); border: 2.5px solid ${primaryColor}; box-shadow: 0 0 25px ${primaryColor}cc; display: flex; align-items: center; justify-content: center;">
                <img 
                  src="/cyclist.gif" 
                  alt="Ciclista a pedalar" 
                  style="width: 40px; height: 40px; object-fit: contain; mix-blend-mode: screen; filter: drop-shadow(0 0 6px ${primaryColor});" 
                />
              </div>
            </div>
          `;

          markerRef.current = new maplibregl.Marker({ element: cyclistEl })
            .setLngLat([initialPoint.lng, initialPoint.lat])
            .addTo(map);

          mapRef.current = map;
          setLoading(false);
        });

      } catch (err) {
        console.error('Error initializing MapLibre 3D map:', err);
        setLoading(false);
      }
    };

    initMap();

    return () => {
      isCancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentRoute, isRose]);

  // Update Map Position, Bearing (Heading), and Tilt smoothly
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !riderPos || !currentRoute) return;

    const targetBearing = isFrontalView ? (riderPos.bearing || 0) : 0;
    const targetPitch = isFrontalView ? 62 : 0;

    // Smooth camera ease to rider position
    map.easeTo({
      center: [riderPos.lng, riderPos.lat],
      bearing: targetBearing,
      pitch: targetPitch,
      zoom: isFrontalView ? zoomLevel : Math.min(16, zoomLevel),
      duration: 350,
      easing: (t) => t
    });

    // Update Cyclist Marker position
    if (markerRef.current) {
      markerRef.current.setLngLat([riderPos.lng, riderPos.lat]);

      // Update halo pulse when pedaling
      const halo = document.getElementById('cyclist-halo');
      if (halo) {
        halo.style.opacity = isPedaling ? '0.5' : '0.15';
        halo.style.transform = isPedaling ? 'scale(1.2)' : 'scale(1)';
      }
    }

    // Update covered track GeoJSON
    const coveredKm = currentDistanceKm % currentRoute.distanceKm;
    const coveredPoints = currentRoute.points
      .filter(p => p.distanceKm <= coveredKm)
      .map(p => [p.lng, p.lat]);
    coveredPoints.push([riderPos.lng, riderPos.lat]);

    const source = map.getSource('route-covered');
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coveredPoints
        }
      });
    }
  }, [riderPos, isFrontalView, currentDistanceKm, currentRoute, isPedaling, zoomLevel]);

  // Toggle Map Style (Satellite vs Street)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(mapStyleType === 'street' ? ESRI_STREET_STYLE : ESRI_SATELLITE_STYLE);
  }, [mapStyleType]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-full z-0"
        style={{ minHeight: '100%', height: '100%', width: '100%' }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div
            className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin mb-4"
            style={{ borderColor: `${primaryColor} transparent ${primaryColor} ${primaryColor}` }}
          />
          <h4 className="text-white font-bold text-base mb-1">A carregar Navegação 3D Satélite...</h4>
          <p className="text-slate-400 text-xs">A preparar vista frontal da estrada em alta resolução.</p>
        </div>
      )}

      {/* 3D Cockpit HUD Overlays */}
      {!loading && (
        <>
          {/* Compass & Mode Badge (Top Left, under HUD) */}
          <div className="absolute top-16 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
            <div className="px-3 py-1.5 rounded-2xl backdrop-blur-xl border border-white/15 bg-black/80 shadow-lg flex items-center gap-2 font-mono text-xs text-white">
              <Navigation2
                className={`w-3.5 h-3.5 ${isRose ? 'text-[#ff2d75]' : 'text-sky-400'} transition-transform duration-300`}
                style={{ transform: `rotate(${riderPos?.bearing || 0}deg)` }}
              />
              <span className="font-bold text-[11px] text-sky-300">
                {Math.round(riderPos?.bearing || 0)}°
              </span>
              <span className="text-[10px] text-slate-400 border-l border-white/20 pl-2">
                {isFrontalView ? 'Visão Frontal (Carro)' : 'Visão Aérea (Norte)'}
              </span>
            </div>

            {/* Perspective View Mode Toggle Button (3D Car Mode vs 2D Top-Down) */}
            <button
              type="button"
              onClick={handleToggleFrontalView}
              className={`px-3 py-1.5 rounded-2xl backdrop-blur-xl border text-xs font-black flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                isFrontalView
                  ? isRose
                    ? 'bg-[#ff2d75] border-[#ff2d75] text-white shadow-[#ff2d75]/50'
                    : 'bg-sky-500 border-sky-400 text-slate-950 shadow-sky-500/40'
                  : 'bg-black/80 border-white/20 text-slate-300 hover:text-white'
              }`}
              title={isFrontalView ? 'Mudar para vista aérea 2D (de cima)' : 'Mudar para visão frontal 3D (como no carro)'}
            >
              <Car className="w-3.5 h-3.5" />
              <span>{isFrontalView ? '🚗 Modo Frontal 3D' : '🗺️ Modo Aéreo 2D'}</span>
            </button>
          </div>

          {/* Quick Zoom & Layer Controls (Top Right) */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
            {/* Zoom In & Zoom Out */}
            <div className="flex flex-col rounded-2xl overflow-hidden border border-white/20 backdrop-blur-xl bg-black/80 shadow-lg">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(19, prev + 0.5))}
                className="w-10 h-8 flex items-center justify-center text-white hover:bg-white/20 transition-all font-black text-sm cursor-pointer"
                title="Aproximar Zoom"
              >
                +
              </button>
              <div className="h-[1px] bg-white/10" />
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(14, prev - 0.5))}
                className="w-10 h-8 flex items-center justify-center text-white hover:bg-white/20 transition-all font-black text-sm cursor-pointer"
                title="Afastar Zoom"
              >
                −
              </button>
            </div>

            {/* Satellite vs Street Map Switcher */}
            <button
              type="button"
              onClick={() => setMapStyleType(prev => prev === 'satellite' ? 'street' : 'satellite')}
              className="px-2.5 h-10 rounded-2xl backdrop-blur-xl border border-white/20 bg-black/80 hover:bg-black/95 text-slate-200 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-lg"
              title="Mudar estilo de mapa (Satélite Real ou Ruas)"
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="text-[10px] hidden sm:inline">
                {mapStyleType === 'satellite' ? '🛰️ Satélite' : '🗺️ Ruas'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
