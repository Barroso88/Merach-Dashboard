import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Compass,
  Layers,
  Car,
  MapPin,
  TrendingUp,
  TrendingDown,
  Mountain,
  Navigation2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { loadMapLibre } from '../services/maplibreLoader';

const UNIFIED_MAP_STYLE = {
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
    },
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
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19,
      layout: { visibility: 'visible' }
    },
    {
      id: 'esri-street-layer',
      type: 'raster',
      source: 'esri-street',
      minzoom: 0,
      maxzoom: 19,
      layout: { visibility: 'none' }
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
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);
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

    setLoading(true);
    setError(null);

    const initMap = async () => {
      try {
        const maplibregl = await loadMapLibre();
        if (isCancelled || !containerRef.current) return;

        const initialPoint = currentRoute.points[0] || { lng: -9.4215, lat: 38.6970 };
        const initialBearing = currentRoute.points[0]?.bearing || 0;

        const map = new maplibregl.Map({
          container: containerRef.current,
          style: UNIFIED_MAP_STYLE,
          center: [initialPoint.lng, initialPoint.lat],
          zoom: 17.5,
          pitch: isFrontalView ? 62 : 0, // 62° 3D forward tilt like a car windshield!
          bearing: isFrontalView ? initialBearing : 0,
          attributionControl: false,
          maxPitch: 75
        });

        map.on('error', (e) => {
          // Log non-fatal tile errors without breaking map
          console.warn('MapLibre event:', e?.error?.message || e);
        });

        map.on('load', () => {
          if (isCancelled) return;

          map.resize();

          // Apply current mapStyleType
          map.setLayoutProperty('esri-satellite-layer', 'visibility', mapStyleType === 'satellite' ? 'visible' : 'none');
          map.setLayoutProperty('esri-street-layer', 'visibility', mapStyleType === 'street' ? 'visible' : 'none');

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
              <div id="cyclist-halo" style="position: absolute; width: 56px; height: 56px; border-radius: 50%; background: ${primaryColor}; opacity: 0.3; transition: all 0.3s;"></div>
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
        if (!isCancelled) {
          setError(err.message || 'Erro ao carregar o motor de navegação 3D.');
          setLoading(false);
        }
      }
    };

    initMap();

    let resizeObserver = null;
    if (window.ResizeObserver && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      isCancelled = true;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [currentRoute, isRose, retryKey]);

  // Update Map Position, Bearing (Heading), and Tilt smoothly
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !riderPos || !currentRoute) return;

    const targetBearing = isFrontalView ? (riderPos.bearing || 0) : 0;
    const targetPitch = isFrontalView ? 62 : 0;

    // Smooth camera ease to rider position (900ms duration glides seamlessly across 1s tick interval)
    map.easeTo({
      center: [riderPos.lng, riderPos.lat],
      bearing: targetBearing,
      pitch: targetPitch,
      zoom: isFrontalView ? zoomLevel : Math.min(16, zoomLevel),
      duration: 900,
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
    const initialPoint = currentRoute.points[0];
    const coveredPoints = currentRoute.points
      .filter(p => p.distanceKm <= coveredKm)
      .map(p => [p.lng, p.lat]);
    coveredPoints.push([riderPos.lng, riderPos.lat]);
    if (coveredPoints.length < 2) {
      coveredPoints.unshift([initialPoint.lng, initialPoint.lat]);
    }

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

  // Toggle Map Style (Satellite vs Street) instantly
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    try {
      map.setLayoutProperty('esri-satellite-layer', 'visibility', mapStyleType === 'satellite' ? 'visible' : 'none');
      map.setLayoutProperty('esri-street-layer', 'visibility', mapStyleType === 'street' ? 'visible' : 'none');
    } catch {
      // Ignore if layers are still initializing
    }
  }, [mapStyleType]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-full z-0"
        style={{ minHeight: '100%', height: '100%', width: '100%' }}
      />

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h4 className="text-white font-bold text-sm">Não foi possível carregar a vista 3D</h4>
          <p className="text-slate-400 text-xs max-w-sm">{error}</p>
          <button
            type="button"
            onClick={() => setRetryKey(k => k + 1)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 hover:opacity-95 transition-all cursor-pointer shadow-lg mt-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Tentar Novamente</span>
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && !error && (
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
      {!loading && !error && (
        <>
          {/* Floating Zoom & Map Style Controls (Positioned safely on right margin, below the top HUD bar) */}
          <div className="absolute top-20 right-4 z-20 flex flex-col items-end gap-2 pointer-events-auto">
            {/* Zoom In & Zoom Out */}
            <div className="flex flex-col rounded-2xl overflow-hidden border border-white/20 backdrop-blur-xl bg-black/85 shadow-xl">
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
              className="px-2.5 h-9 rounded-2xl backdrop-blur-xl border border-white/20 bg-black/85 hover:bg-black/95 text-slate-200 hover:text-white flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer shadow-xl"
              title="Mudar estilo de mapa (Satélite Real ou Ruas)"
            >
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[10px]">
                {mapStyleType === 'satellite' ? '🛰️ Satélite' : '🗺️ Ruas'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
