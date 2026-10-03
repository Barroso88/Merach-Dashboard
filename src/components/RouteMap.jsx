import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Navigation,
  Mountain,
  TrendingUp,
  TrendingDown,
  Flag,
  Upload,
  Compass,
  Check,
  ChevronDown,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles
} from 'lucide-react';
import {
  PRESET_ROUTES,
  parseGpxRoute,
  getRiderPositionAlongRoute
} from '../services/routesData';

export default function RouteMap({
  currentDistanceKm = 0,
  speedKmH = 0,
  cadenceRpm = 0,
  themeConfig,
  workoutStatus
}) {
  const isRose = themeConfig?.id === 'rose';
  const primaryColor = isRose ? '#ff2d75' : '#38bdf8';
  const secondaryColor = isRose ? '#9400D3' : '#10b981';

  // Routes state
  const [routesList, setRoutesList] = useState(PRESET_ROUTES);
  const [selectedRouteId, setSelectedRouteId] = useState(PRESET_ROUTES[0].id);
  const [isRouteSelectorOpen, setIsRouteSelectorOpen] = useState(false);
  const [autoFollow, setAutoFollow] = useState(true);
  const [mapStyle, setMapStyle] = useState('dark'); // 'dark' | 'standard'

  const fileInputRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const fullPolylineRef = useRef(null);
  const coveredPolylineRef = useRef(null);
  const riderMarkerRef = useRef(null);
  const startMarkerRef = useRef(null);
  const finishMarkerRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Active route
  const currentRoute = useMemo(() => {
    return routesList.find(r => r.id === selectedRouteId) || routesList[0];
  }, [routesList, selectedRouteId]);

  // Interpolated rider position along the route
  const riderPos = useMemo(() => {
    return getRiderPositionAlongRoute(currentRoute, currentDistanceKm);
  }, [currentRoute, currentDistanceKm]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = currentRoute.points[0]?.lat || 38.6970;
      const initialLng = currentRoute.points[0]?.lng || -9.4215;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false
      });

      // Add zoom control to top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Official OpenStreetMap Tile Layer (100% Free, No API Key, No Watermark)
      const tileUrl = mapStyle === 'cycling'
        ? 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'
        : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: mapStyle === 'cycling' ? 'abc' : ''
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Switch Tile Style (Dark / Standard OSM / CyclOSM)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const tileUrl = mapStyle === 'cycling'
      ? 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png'
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    tileLayerRef.current = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: mapStyle === 'cycling' ? 'abc' : ''
    }).addTo(mapInstanceRef.current);
  }, [mapStyle]);

  // Draw or Update Route Polylines and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !currentRoute || !currentRoute.points.length) return;

    const latLngs = currentRoute.points.map(p => [p.lat, p.lng]);

    // 1. Full Route Polyline (Glow / Inactive)
    if (fullPolylineRef.current) {
      map.removeLayer(fullPolylineRef.current);
    }
    fullPolylineRef.current = L.polyline(latLngs, {
      color: isRose ? '#4a1538' : '#1e293b',
      weight: 6,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '3, 6'
    }).addTo(map);

    // 2. Start Marker
    if (startMarkerRef.current) map.removeLayer(startMarkerRef.current);
    const startPoint = latLngs[0];
    const startIcon = L.divIcon({
      className: 'custom-start-marker',
      html: `
        <div style="background: #10b981; color: black; font-weight: 900; font-size: 10px; padding: 4px 8px; border-radius: 9999px; box-shadow: 0 0 12px rgba(16,185,129,0.8); border: 2px solid white; display: flex; align-items: center; gap: 3px;">
          <span>🚦</span> Partida
        </div>
      `,
      iconSize: [60, 24],
      iconAnchor: [30, 12]
    });
    startMarkerRef.current = L.marker(startPoint, { icon: startIcon }).addTo(map);

    // 3. Finish Marker
    if (finishMarkerRef.current) map.removeLayer(finishMarkerRef.current);
    const finishPoint = latLngs[latLngs.length - 1];
    const finishIcon = L.divIcon({
      className: 'custom-finish-marker',
      html: `
        <div style="background: #f43f5e; color: white; font-weight: 900; font-size: 10px; padding: 4px 8px; border-radius: 9999px; box-shadow: 0 0 12px rgba(244,63,94,0.8); border: 2px solid white; display: flex; align-items: center; gap: 3px;">
          <span>🏁</span> Meta (${currentRoute.distanceKm} km)
        </div>
      `,
      iconSize: [80, 24],
      iconAnchor: [40, 12]
    });
    finishMarkerRef.current = L.marker(finishPoint, { icon: finishIcon }).addTo(map);

    // Fit map bounds to whole route on route change
    map.fitBounds(fullPolylineRef.current.getBounds(), { padding: [50, 50] });

  }, [currentRoute, isRose]);

  // Update Rider Marker and Covered Track in Real-Time
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !riderPos || !currentRoute) return;

    // 1. Covered Track Polyline
    const coveredKm = currentDistanceKm % currentRoute.distanceKm;
    const coveredPoints = currentRoute.points
      .filter(p => p.distanceKm <= coveredKm)
      .map(p => [p.lat, p.lng]);
    coveredPoints.push([riderPos.lat, riderPos.lng]);

    if (coveredPolylineRef.current) {
      map.removeLayer(coveredPolylineRef.current);
    }
    coveredPolylineRef.current = L.polyline(coveredPoints, {
      color: primaryColor,
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
      shadowColor: primaryColor,
      shadowBlur: 10
    }).addTo(map);

    // 2. Dynamic Rider Marker
    const bearing = riderPos.bearing || 0;
    const isPedaling = speedKmH > 1;

    const riderIcon = L.divIcon({
      className: 'custom-rider-marker',
      html: `
        <div style="position: relative; width: 44px; height: 44px; display: flex; items-center; justify-content: center;">
          <!-- Pulsing halo when pedaling -->
          <div style="position: absolute; inset: 0; border-radius: 50%; background: ${primaryColor}; opacity: ${isPedaling ? '0.4' : '0.15'}; animation: ${isPedaling ? 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' : 'none'};"></div>
          
          <!-- Outer circular badge with heading indicator -->
          <div style="position: relative; width: 38px; height: 38px; border-radius: 50%; background: #090d16; border: 2.5px solid ${primaryColor}; box-shadow: 0 0 16px ${primaryColor}99; display: flex; align-items: center; justify-content: center; transform: rotate(${bearing}deg); transition: transform 0.4s ease;">
            <!-- Heading Direction Needle -->
            <div style="position: absolute; top: -6px; width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 7px solid ${primaryColor};"></div>
            <!-- Bike Icon -->
            <span style="font-size: 18px; transform: rotate(-${bearing}deg);">🚴</span>
          </div>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    if (!riderMarkerRef.current) {
      riderMarkerRef.current = L.marker([riderPos.lat, riderPos.lng], { icon: riderIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      riderMarkerRef.current.setLatLng([riderPos.lat, riderPos.lng]);
      riderMarkerRef.current.setIcon(riderIcon);
    }

    // Auto-follow pan
    if (autoFollow) {
      map.panTo([riderPos.lat, riderPos.lng], { animate: true, duration: 0.8 });
    }
  }, [riderPos, currentDistanceKm, speedKmH, primaryColor, autoFollow, currentRoute]);

  // Handle GPX File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (typeof text === 'string') {
          const parsed = parseGpxRoute(text, file.name);
          setRoutesList(prev => [parsed, ...prev]);
          setSelectedRouteId(parsed.id);
          setIsRouteSelectorOpen(false);
        }
      } catch (err) {
        alert(`Erro ao ler ficheiro GPX: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Slope indicator text & color
  const getGradientBadge = (gradient) => {
    if (gradient > 3) {
      return {
        label: `+${gradient}% Subida`,
        color: 'text-rose-400 bg-rose-500/20 border-rose-500/40',
        icon: TrendingUp
      };
    }
    if (gradient < -2) {
      return {
        label: `${gradient}% Descida`,
        color: 'text-sky-400 bg-sky-500/20 border-sky-500/40',
        icon: TrendingDown
      };
    }
    return {
      label: `${gradient >= 0 ? '+' : ''}${gradient}% Plano`,
      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40',
      icon: Mountain
    };
  };

  const gradientBadge = riderPos ? getGradientBadge(riderPos.gradient) : null;
  const GradientIcon = gradientBadge?.icon || Mountain;

  return (
    <div className="w-full flex flex-col gap-4 animate-fadeIn">
      {/* MAP VIEWPORT CONTAINER */}
      <div className={`relative w-full h-[520px] md:h-[580px] rounded-3xl overflow-hidden border shadow-2xl transition-all ${
        isRose ? 'border-[#ff2d75]/40 shadow-[0_0_35px_-5px_rgba(255,45,117,0.3)]' : 'border-sky-500/30 shadow-[0_0_35px_-5px_rgba(56,189,248,0.25)]'
      }`}>
        {/* Real Leaflet Map */}
        <div ref={mapContainerRef} className={`w-full h-full z-0 ${mapStyle === 'dark' ? 'leaflet-dark-tiles' : ''}`} />

        {/* TOP HUD BAR: Route Title, Selector & GPX Upload */}
        <div className="absolute top-4 left-4 right-16 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            {/* Route Selector Dropdown Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRouteSelectorOpen(!isRouteSelectorOpen)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl backdrop-blur-xl border font-bold text-xs shadow-lg transition-all cursor-pointer ${
                  isRose
                    ? 'bg-[#290534]/90 border-[#ff2d75]/50 text-white hover:border-[#ff2d75]'
                    : 'bg-slate-900/90 border-slate-700/80 text-white hover:border-sky-500'
                }`}
              >
                <Navigation className={`w-3.5 h-3.5 ${isRose ? 'text-[#ff2d75]' : 'text-sky-400'}`} />
                <div className="text-left">
                  <span className="block text-[11px] font-black truncate max-w-[160px] sm:max-w-[220px]">
                    {currentRoute.name}
                  </span>
                  <span className="block text-[9px] font-mono text-slate-400">
                    {currentRoute.distanceKm} km • {currentRoute.elevationGain}m D+
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Route Picker Modal / Dropdown */}
              {isRouteSelectorOpen && (
                <div className={`absolute top-full left-0 mt-2 w-80 rounded-2xl p-2.5 backdrop-blur-2xl border shadow-2xl z-50 animate-fadeIn ${
                  isRose ? 'bg-[#1e0326]/95 border-[#ff2d75]/50' : 'bg-slate-950/95 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escolher Percurso Real</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-white cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Carregar .GPX</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {routesList.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setSelectedRouteId(r.id);
                          setIsRouteSelectorOpen(false);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                          r.id === selectedRouteId
                            ? isRose
                              ? 'bg-[#ff2d75]/25 border-[#ff2d75] text-white'
                              : 'bg-sky-500/20 border-sky-400 text-white'
                            : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-xs truncate">{r.name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{r.location}</p>
                          <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-slate-400">
                            <span>{r.distanceKm} km</span>
                            <span>•</span>
                            <span>+{r.elevationGain}m</span>
                            <span>•</span>
                            <span className={r.difficulty.includes('Difícil') ? 'text-rose-400' : 'text-emerald-400'}>{r.difficulty}</span>
                          </div>
                        </div>
                        {r.id === selectedRouteId && (
                          <Check className={`w-4 h-4 flex-shrink-0 ${isRose ? 'text-[#ff2d75]' : 'text-sky-400'}`} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Hidden GPX File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".gpx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}
            </div>

            {/* Quick Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-2xl backdrop-blur-xl border border-white/15 bg-black/60 hover:bg-black/80 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
              title="Carregar percurso personalizado GPX do Strava ou Garmin"
            >
              <Upload className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">GPX</span>
            </button>
          </div>

          {/* Quick HUD Pill: Gradient / Slope & Elevation */}
          {riderPos && gradientBadge && (
            <div className="flex items-center gap-2 pointer-events-auto">
              <div className={`px-3 py-1.5 rounded-2xl backdrop-blur-xl border font-mono font-bold text-xs flex items-center gap-2 shadow-lg ${gradientBadge.color}`}>
                <GradientIcon className="w-3.5 h-3.5" />
                <span>{gradientBadge.label}</span>
                <span className="text-[10px] text-slate-300 border-l border-white/20 pl-2">
                  {riderPos.ele} m Alt
                </span>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM HUD PANEL: Live Progress & Rider Stats */}
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
          <div className={`p-4 rounded-3xl backdrop-blur-2xl border shadow-2xl pointer-events-auto ${
            isRose ? 'bg-[#1b0323]/90 border-[#ff2d75]/40' : 'bg-slate-950/90 border-slate-800'
          }`}>
            {/* Real-Time Progress Bar on Route */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="flex items-center gap-1.5 text-white">
                  <Flag className={`w-3.5 h-3.5 ${isRose ? 'text-[#ff2d75]' : 'text-sky-400'}`} />
                  <span>Progresso da Rota:</span>
                  <span style={{ color: primaryColor }}>{riderPos?.progressPercent || 0}%</span>
                </span>
                <span className="text-slate-400 text-[11px]">
                  Faltam <strong className="text-white">{riderPos?.remainingKm || currentRoute.distanceKm} km</strong> para a meta
                </span>
              </div>

              {/* Progress Track with animated bicycle icon indicator */}
              <div className="relative w-full h-3 bg-black/60 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${riderPos?.progressPercent || 0}%`,
                    background: isRose
                      ? 'linear-gradient(to right, #9400D3, #ff2d75)'
                      : 'linear-gradient(to right, #0284c7, #38bdf8)'
                  }}
                />
              </div>
            </div>

            {/* Quick Live Telemetry Strip on Map */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center font-mono">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">Velocidade</span>
                <span className="text-base font-black text-white">{speedKmH} <span className="text-[10px] text-slate-400">km/h</span></span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">Cadência</span>
                <span className="text-base font-black text-white">{cadenceRpm} <span className="text-[10px] text-slate-400">RPM</span></span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">Distância Treino</span>
                <span className="text-base font-black text-white">{currentDistanceKm} <span className="text-[10px] text-slate-400">km</span></span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">Volta / Lap</span>
                <span className="text-base font-black text-white">#{riderPos?.lapNumber || 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAP CONTROLS OVERLAY: Auto-Follow & Tile Layer Switcher */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
          {/* Auto-Follow Toggle */}
          <button
            type="button"
            onClick={() => setAutoFollow(!autoFollow)}
            className={`w-10 h-10 rounded-2xl backdrop-blur-xl border flex items-center justify-center transition-all cursor-pointer shadow-lg ${
              autoFollow
                ? isRose
                  ? 'bg-[#ff2d75] border-[#ff2d75] text-white shadow-[#ff2d75]/50'
                  : 'bg-sky-500 border-sky-400 text-slate-950 shadow-sky-500/40'
                : 'bg-black/70 border-white/20 text-slate-400 hover:text-white'
            }`}
            title={autoFollow ? 'Câmara a seguir o ciclista (Ativo)' : 'Câmara livre'}
          >
            <Compass className={`w-5 h-5 ${autoFollow ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>

          {/* Map Layer Mode Switcher: Dark vs Standard OSM vs CyclOSM */}
          <button
            type="button"
            onClick={() => {
              setMapStyle(prev => {
                if (prev === 'dark') return 'standard';
                if (prev === 'standard') return 'cycling';
                return 'dark';
              });
            }}
            className="w-10 h-10 rounded-2xl backdrop-blur-xl border border-white/20 bg-black/70 hover:bg-black/90 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shadow-lg"
            title={`Estilo Atual: ${
              mapStyle === 'dark' ? 'Modo Escuro Neon' : mapStyle === 'standard' ? 'OpenStreetMap Padrão' : 'Ciclovias (CyclOSM)'
            } (Clica para alternar)`}
          >
            <Layers className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ELEVATION PROFILE CARD (Altimetria da Rota) */}
      <div className={`p-5 rounded-3xl border shadow-xl backdrop-blur-xl ${
        isRose ? 'bg-[#290534]/60 border-[#ff2d75]/30' : 'bg-slate-950/70 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Mountain className={`w-4 h-4 ${isRose ? 'text-[#ff2d75]' : 'text-sky-400'}`} />
            <h4 className="font-bold text-xs uppercase tracking-wider text-white">
              Perfil Altimétrico do Percurso
            </h4>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
            <span>Subida Acumulada: <strong className="text-white">+{currentRoute.elevationGain} m</strong></span>
            <span>•</span>
            <span>Inclinação Média: <strong className="text-white">{currentRoute.gradientAvg}</strong></span>
          </div>
        </div>

        {/* SVG Elevation Profile Chart */}
        <div className="relative w-full h-24 pt-2">
          {currentRoute.points.length > 1 && (
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={primaryColor} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={primaryColor} stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Compute SVG polygon points */}
              {(() => {
                const minEle = Math.min(...currentRoute.points.map(p => p.ele));
                const maxEle = Math.max(...currentRoute.points.map(p => p.ele));
                const eleRange = Math.max(10, maxEle - minEle);
                const totalDist = currentRoute.distanceKm;

                const polyPoints = currentRoute.points.map(p => {
                  const x = (p.distanceKm / totalDist) * 100;
                  const y = 95 - ((p.ele - minEle) / eleRange) * 85;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                }).join(' ');

                const areaPoints = `0,100 ${polyPoints} 100,100`;

                // Current rider x position
                const currentKm = currentDistanceKm % totalDist;
                const riderX = Math.min(100, Math.max(0, (currentKm / totalDist) * 100));
                const riderY = riderPos ? 95 - ((riderPos.ele - minEle) / eleRange) * 85 : 50;

                return (
                  <>
                    {/* Shaded Area */}
                    <polygon points={areaPoints} fill="url(#elevationGrad)" />

                    {/* Mountain Ridge Stroke */}
                    <polyline
                      points={polyPoints}
                      fill="none"
                      stroke={primaryColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Current Rider Position Indicator on Elevation Profile */}
                    <line
                      x1={riderX}
                      y1="0"
                      x2={riderX}
                      y2="100"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                      opacity="0.7"
                    />
                    <circle
                      cx={riderX}
                      cy={riderY}
                      r="4.5"
                      fill={secondaryColor}
                      stroke="white"
                      strokeWidth="2"
                    />
                  </>
                );
              })()}
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
