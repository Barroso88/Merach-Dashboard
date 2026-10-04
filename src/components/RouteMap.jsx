import React, { useRef, useState, useMemo } from 'react';
import {
  Navigation,
  Mountain,
  TrendingUp,
  TrendingDown,
  Flag,
  Upload,
  Check,
  ChevronDown,
  Layers,
  Car,
  Plus,
  Trash2
} from 'lucide-react';
import {
  PRESET_ROUTES,
  parseGpxRoute,
  getRiderPositionAlongRoute
} from '../services/routesData';
import { getStoredCustomRoutes, deleteCustomRoute } from '../services/routePlannerService';
import CarView3DMap from './CarView3DMap';
import RoutePlannerModal from './RoutePlannerModal';
import { getStoredSettings } from '../services/storageService';

export default function RouteMap({
  currentDistanceKm = 0,
  speedKmH = 0,
  cadenceRpm = 0,
  themeConfig,
  workoutStatus,
  googleMapsApiKey
}) {
  const isRose = themeConfig?.id === 'rose';
  const primaryColor = isRose ? '#ff2d75' : '#38bdf8';
  const secondaryColor = isRose ? '#9400D3' : '#10b981';

  // Google Maps API Key resolution
  const effectiveApiKey = useMemo(() => {
    return (
      googleMapsApiKey ||
      getStoredSettings()?.googleMapsApiKey ||
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
      'AIzaSyAvscR3r1g4VGLbRpdKoC7DtB9Ezla_oac'
    ).trim();
  }, [googleMapsApiKey]);

  // View Mode: 'frontal3d' (default - Visão Frontal Carro 3D) | 'aerial2d' (Visão Aérea 2D)
  const [viewMode, setViewMode] = useState('frontal3d');

  // Routes state: Stored custom routes + official presets
  const [routesList, setRoutesList] = useState(() => {
    const custom = getStoredCustomRoutes();
    return [...custom, ...PRESET_ROUTES];
  });
  const [selectedRouteId, setSelectedRouteId] = useState(() => {
    const custom = getStoredCustomRoutes();
    return custom.length > 0 ? custom[0].id : PRESET_ROUTES[0].id;
  });
  const [isRouteSelectorOpen, setIsRouteSelectorOpen] = useState(false);
  const [isRoutePlannerOpen, setIsRoutePlannerOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Active route
  const currentRoute = useMemo(() => {
    return routesList.find(r => r.id === selectedRouteId) || routesList[0];
  }, [routesList, selectedRouteId]);

  // Interpolated rider position along the route
  const riderPos = useMemo(() => {
    return getRiderPositionAlongRoute(currentRoute, currentDistanceKm);
  }, [currentRoute, currentDistanceKm]);

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
      {/* MAP & STREET VIEW VIEWPORT CONTAINER */}
      <div className={`relative w-full h-[540px] md:h-[620px] rounded-3xl overflow-hidden border shadow-2xl transition-all ${
        isRose ? 'border-[#ff2d75]/40 shadow-[0_0_35px_-5px_rgba(255,45,117,0.3)]' : 'border-sky-500/30 shadow-[0_0_35px_-5px_rgba(56,189,248,0.25)]'
      }`}>
        {/* VIEW AREA: 3D Car Navigation / Aerial Satellite */}
        <div className="relative w-full h-full overflow-hidden bg-slate-950">
          <CarView3DMap
            currentRoute={currentRoute}
            riderPos={riderPos}
            speedKmH={speedKmH}
            currentDistanceKm={currentDistanceKm}
            isRose={isRose}
            primaryColor={primaryColor}
            isFrontalView={viewMode === 'frontal3d'}
            onToggleFrontalView={(val) => setViewMode(val ? 'frontal3d' : 'aerial2d')}
          />
        </div>

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
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Percursos Reais</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRouteSelectorOpen(false);
                          setIsRoutePlannerOpen(true);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-white cursor-pointer"
                        title="Criar novo percurso com partida e chegada"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Novo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-white cursor-pointer"
                        title="Carregar ficheiro .GPX"
                      >
                        <Upload className="w-3 h-3" />
                        <span>GPX</span>
                      </button>
                    </div>
                  </div>

                  {/* Create New Route Prominent Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRouteSelectorOpen(false);
                      setIsRoutePlannerOpen(true);
                    }}
                    className={`w-full mb-2 p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-black transition-all cursor-pointer shadow-md ${
                      isRose
                        ? 'bg-[#ff2d75]/20 border-[#ff2d75]/50 hover:bg-[#ff2d75]/30 text-white'
                        : 'bg-emerald-500/20 border-emerald-400/50 hover:bg-emerald-500/30 text-emerald-300 hover:text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Criar Rota (Partida ➔ Chegada)</span>
                  </button>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {routesList.map(r => (
                      <div
                        key={r.id}
                        className={`group relative w-full p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          r.id === selectedRouteId
                            ? isRose
                              ? 'bg-[#ff2d75]/25 border-[#ff2d75] text-white'
                              : 'bg-sky-500/20 border-sky-400 text-white'
                            : 'bg-white/5 border-transparent text-slate-300 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRouteId(r.id);
                            setIsRouteSelectorOpen(false);
                          }}
                          className="min-w-0 flex-1 text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-xs truncate">{r.name}</p>
                            {r.isCustom && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                                Criado
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{r.location}</p>
                          <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-slate-400">
                            <span>{r.distanceKm} km</span>
                            <span>•</span>
                            <span>+{r.elevationGain}m</span>
                            <span>•</span>
                            <span className={r.difficulty.includes('Difícil') ? 'text-rose-400' : 'text-emerald-400'}>{r.difficulty}</span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1">
                          {r.isCustom && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = deleteCustomRoute(r.id);
                                setRoutesList([...updated, ...PRESET_ROUTES]);
                                if (selectedRouteId === r.id) {
                                  setSelectedRouteId(PRESET_ROUTES[0].id);
                                }
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer opacity-70 group-hover:opacity-100"
                              title="Eliminar este percurso personalizado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {r.id === selectedRouteId && (
                            <Check className={`w-4 h-4 flex-shrink-0 ${isRose ? 'text-[#ff2d75]' : 'text-sky-400'}`} />
                          )}
                        </div>
                      </div>
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

            {/* Quick Create Route Button */}
            <button
              type="button"
              onClick={() => setIsRoutePlannerOpen(true)}
              className={`px-3 py-2 rounded-2xl backdrop-blur-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${
                isRose
                  ? 'border-[#ff2d75]/50 bg-[#ff2d75]/20 hover:bg-[#ff2d75]/35 text-white'
                  : 'border-emerald-400/50 bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 hover:text-white'
              }`}
              title="Criar novo percurso personalizado com ponto de partida e chegada"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Novo Percurso</span>
            </button>

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

            {/* View Mode Switcher: Visão Frontal 3D (Carro) vs Visão Aérea */}
            <div className="flex items-center p-1 rounded-2xl backdrop-blur-xl border border-white/15 bg-black/85 shadow-lg">
              <button
                type="button"
                onClick={() => setViewMode('frontal3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'frontal3d'
                    ? isRose
                      ? 'bg-gradient-to-r from-[#9400D3] to-[#ff2d75] text-white shadow-md'
                      : 'bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Visão Frontal 3D da Estrada (Cockpit / Como no Carro)"
              >
                <Car className="w-3.5 h-3.5" />
                <span>Visão Frontal (Carro)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('aerial2d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'aerial2d'
                    ? isRose
                      ? 'bg-gradient-to-r from-[#9400D3] to-[#ff2d75] text-white shadow-md'
                      : 'bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Visão Aérea Satélite (Vista Superior do Percurso)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Visão Aérea</span>
              </button>
            </div>
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

      {/* Interactive Route Planner Modal */}
      <RoutePlannerModal
        isOpen={isRoutePlannerOpen}
        onClose={() => setIsRoutePlannerOpen(false)}
        onRouteCreated={(newRoute) => {
          setRoutesList(prev => [newRoute, ...prev.filter(r => r.id !== newRoute.id)]);
          setSelectedRouteId(newRoute.id);
        }}
        isRose={isRose}
        primaryColor={primaryColor}
      />
    </div>
  );
}
