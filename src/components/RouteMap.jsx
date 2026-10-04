import React, { useRef, useState, useMemo, useEffect } from 'react';
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
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer,
  Flame,
  Gauge,
  Maximize2,
  Minimize2
} from 'lucide-react';
import {
  PRESET_ROUTES,
  parseGpxRoute,
  getRiderPositionAlongRoute
} from '../services/routesData';
import {
  getStoredCustomRoutes,
  saveCustomRoute,
  deleteCustomRoute,
  fetchServerCustomRoutes
} from '../services/routePlannerService';
import CarView3DMap from './CarView3DMap';
import RoutePlannerModal from './RoutePlannerModal';
import { getStoredSettings } from '../services/storageService';

export default function RouteMap({
  currentDistanceKm = 0,
  speedKmH = 0,
  cadenceRpm = 0,
  caloriesKcal = 0,
  elapsedSeconds = 0,
  targetSeconds = 0,
  themeConfig,
  workoutStatus = 'idle',
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  onExitRouteMode,
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

  // Sync server custom routes on mount (e.g. from PostgreSQL / backend routes.json)
  useEffect(() => {
    fetchServerCustomRoutes().then((serverRoutes) => {
      if (Array.isArray(serverRoutes) && serverRoutes.length > 0) {
        setRoutesList([...serverRoutes, ...PRESET_ROUTES]);
      }
    });
  }, []);

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
          const updatedCustom = saveCustomRoute(parsed);
          setRoutesList([...updatedCustom, ...PRESET_ROUTES]);
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

  // Browser Fullscreen API handler
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsBrowserFullscreen(true);
      }).catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsBrowserFullscreen(false);
      }).catch((err) => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const formatTime = (totalSecs) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n) => String(n).padStart(2, '0');
    if (hours > 0) {
      return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const isCountdownMode = targetSeconds > 0;
  const remainingSeconds = isCountdownMode ? Math.max(0, targetSeconds - elapsedSeconds) : 0;

  const statusConfig = {
    idle: {
      label: 'Sessão Parada',
      badgeColor: isRose ? 'bg-[#3b0748] text-pink-200 border-[#ff2d75]/35' : 'bg-slate-800 text-slate-400 border-slate-700',
      dotColor: isRose ? 'bg-[#ff2d75]' : 'bg-slate-500'
    },
    running: {
      label: isCountdownMode ? 'Contagem Ativa' : 'A Treinar',
      badgeColor: isRose 
        ? 'bg-[#ff2d75]/25 text-white border-[#ff2d75]/60 shadow-[0_0_12px_rgba(255,45,117,0.4)]' 
        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      dotColor: isRose ? 'bg-[#ff2d75] animate-ping' : 'bg-emerald-400 animate-ping'
    },
    paused: {
      label: 'Treino Pausado',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-400'
    }
  };
  const currentStatus = statusConfig[workoutStatus] || statusConfig.idle;

  return (
    <div className="w-full h-full flex flex-col relative animate-fadeIn">
      {/* MAP & STREET VIEW VIEWPORT CONTAINER (Full Screen Immersion) */}
      <div className={`relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden border shadow-2xl transition-all ${
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

        {/* TOP HUD BAR: Route Title, Selector & GPX Upload (Positioned clearly below the top Navbar) */}
        <div className="absolute top-[76px] sm:top-[82px] left-3 right-3 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            {/* Route Selector Dropdown Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsRouteSelectorOpen(!isRouteSelectorOpen)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl backdrop-blur-xl border font-bold text-xs shadow-lg transition-all cursor-pointer ${
                  isRose
                    ? 'bg-[#290534]/95 border-[#ff2d75]/50 text-white hover:border-[#ff2d75]'
                    : 'bg-slate-900/95 border-slate-700/80 text-white hover:border-sky-500'
                }`}
                title="Clique para escolher entre os percursos oficiais e personalizados"
              >
                <Navigation className={`w-3.5 h-3.5 shrink-0 ${isRose ? 'text-[#ff2d75]' : 'text-sky-400'}`} />
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="block text-[11px] font-black truncate max-w-[150px] sm:max-w-[220px]">
                      {currentRoute?.name || 'Selecionar Percurso'}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                      isRose ? 'bg-[#ff2d75]/20 text-pink-300' : 'bg-sky-500/20 text-sky-300'
                    }`}>
                      Alterar ▾
                    </span>
                  </div>
                  <span className="block text-[9px] font-mono text-slate-400">
                    {currentRoute?.distanceKm || 0} km • {currentRoute?.elevationGain || 0}m D+
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Route Picker Modal / Dropdown */}
              {isRouteSelectorOpen && (
                <div className={`absolute top-full left-0 mt-2 w-80 sm:w-96 rounded-2xl p-3 backdrop-blur-2xl border shadow-2xl z-50 animate-fadeIn ${
                  isRose ? 'bg-[#1e0326]/98 border-[#ff2d75]/50' : 'bg-slate-950/98 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between px-1 py-1 mb-2.5 border-b border-white/10">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Navigation className="w-3 h-3 text-sky-400" />
                      Percursos Disponíveis ({routesList.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRouteSelectorOpen(false);
                          setIsRoutePlannerOpen(true);
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-white cursor-pointer"
                        title="Criar novo percurso com partida e chegada"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Novo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 text-[11px] font-bold text-sky-400 hover:text-white cursor-pointer"
                        title="Carregar ficheiro .GPX"
                      >
                        <Upload className="w-3.5 h-3.5" />
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
                    className={`w-full mb-2.5 p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-black transition-all cursor-pointer shadow-md ${
                      isRose
                        ? 'bg-[#ff2d75]/25 border-[#ff2d75]/60 hover:bg-[#ff2d75]/35 text-white'
                        : 'bg-emerald-500/25 border-emerald-400/60 hover:bg-emerald-500/35 text-emerald-300 hover:text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4 text-emerald-400" />
                    <span>Criar Novo Percurso (Partida ➔ Chegada)</span>
                  </button>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {routesList.map(r => (
                      <div
                        key={r.id}
                        className={`group relative w-full p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                          r.id === selectedRouteId
                            ? isRose
                              ? 'bg-[#ff2d75]/25 border-[#ff2d75] text-white shadow-sm'
                              : 'bg-sky-500/20 border-sky-400 text-white shadow-sm'
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
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shrink-0">
                                Personalizado
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{r.location}</p>
                          <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-slate-400">
                            <span className="text-white font-bold">{r.distanceKm} km</span>
                            <span>•</span>
                            <span>+{r.elevationGain}m</span>
                            <span>•</span>
                            <span className={r.difficulty?.includes('Difícil') ? 'text-rose-400' : 'text-emerald-400'}>{r.difficulty}</span>
                          </div>
                        </button>

                        <div className="flex items-center gap-1 pl-2">
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
                  ? 'border-[#ff2d75]/50 bg-[#ff2d75]/25 hover:bg-[#ff2d75]/40 text-white'
                  : 'border-emerald-400/50 bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 hover:text-white'
              }`}
              title="Criar novo percurso personalizado com ponto de partida e chegada"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Criar Rota</span>
            </button>

            {/* Quick Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-2xl backdrop-blur-xl border border-white/15 bg-black/75 hover:bg-black/90 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
              title="Carregar percurso personalizado GPX do Strava ou Garmin"
            >
              <Upload className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>GPX</span>
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
                <span>Visão Frontal</span>
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

          {/* Top Right Quick Actions: Gradient Badge, Return to Gauges & Fullscreen */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {riderPos && gradientBadge && (
              <div className={`px-3 py-1.5 rounded-2xl backdrop-blur-xl border font-mono font-bold text-xs flex items-center gap-2 shadow-lg ${gradientBadge.color}`}>
                <GradientIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{gradientBadge.label}</span>
                <span className="text-[10px] text-slate-300 border-l border-white/20 pl-2">
                  {riderPos.ele}m
                </span>
                <span className="text-[10px] text-sky-300 border-l border-white/20 pl-2 flex items-center gap-1 font-bold">
                  <span>🧭</span>
                  <span>{Math.round(riderPos.bearing || 0)}°</span>
                </span>
              </div>
            )}

            {/* Return to Gauges View */}
            {onExitRouteMode && (
              <button
                type="button"
                onClick={onExitRouteMode}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl backdrop-blur-xl border font-bold text-xs shadow-lg transition-all cursor-pointer ${
                  isRose
                    ? 'bg-[#290534]/90 border-[#ff2d75]/50 text-pink-200 hover:text-white'
                    : 'bg-slate-900/90 border-slate-700/80 text-sky-300 hover:text-white hover:border-sky-400'
                }`}
                title="Voltar aos Manómetros & Telemetria"
              >
                <Gauge className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Manómetros</span>
              </button>
            )}

            {/* Browser Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleBrowserFullscreen}
              className="p-1.5 rounded-2xl backdrop-blur-xl border border-white/15 bg-black/75 hover:bg-black/90 text-slate-300 hover:text-white transition-all shadow-lg cursor-pointer"
              title={isBrowserFullscreen ? "Sair de Ecrã Completo" : "Ecrã Completo"}
            >
              {isBrowserFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* BOTTOM HUD PANEL: Live Progress, Telemetry & Workout Controls */}
        <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-6 md:right-6 z-30 pointer-events-none">
          <div className={`p-3 md:p-4 rounded-2xl md:rounded-3xl backdrop-blur-2xl border shadow-2xl pointer-events-auto transition-all ${
            isRose ? 'bg-[#1b0323]/92 border-[#ff2d75]/40 shadow-[0_15px_50px_rgba(255,45,117,0.35)]' : 'bg-slate-950/92 border-slate-800/90 shadow-[0_15px_50px_rgba(0,0,0,0.85)]'
          }`}>
            {/* Real-Time Progress Bar on Route */}
            <div className="space-y-1 mb-2.5">
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

              {/* Progress Track */}
              <div className="relative w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10">
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

            {/* Unified Bottom Strip: Live Telemetry (4 tiles) + Workout Controls (Timer & Buttons) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-center pt-2 border-t border-white/10">
              
              {/* Telemetry Strip (4 Metrics): Velocidade, Cadência, Distância, Calorias */}
              <div className="lg:col-span-7 grid grid-cols-4 gap-2 text-center font-mono">
                {/* Velocidade */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="block text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-sans">Velocidade</span>
                  <span className="text-sm md:text-base font-black text-white">{speedKmH} <span className="text-[9px] md:text-[10px] text-slate-400">km/h</span></span>
                </div>

                {/* Cadência */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="block text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-sans">Cadência</span>
                  <span className="text-sm md:text-base font-black text-white">{cadenceRpm} <span className="text-[9px] md:text-[10px] text-slate-400">RPM</span></span>
                </div>

                {/* Distância */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                  <span className="block text-[8px] md:text-[9px] uppercase tracking-wider text-slate-400 font-sans">Distância</span>
                  <span className="text-sm md:text-base font-black text-white">{Number(currentDistanceKm || 0).toFixed(2)} <span className="text-[9px] md:text-[10px] text-slate-400">km</span></span>
                </div>

                {/* Calorias (Substitui Volta / Lap #1) */}
                <div className="p-2 rounded-xl bg-white/5 border border-amber-500/30">
                  <span className="block text-[8px] md:text-[9px] uppercase tracking-wider text-amber-300 font-sans flex items-center justify-center gap-1">
                    <Flame className="w-2.5 h-2.5 text-amber-400" />
                    Calorias
                  </span>
                  <span className="text-sm md:text-base font-black text-amber-400">{Math.round(caloriesKcal || 0)} <span className="text-[9px] md:text-[10px] text-amber-300/80">kcal</span></span>
                </div>
              </div>

              {/* Workout Controls Strip: Tempo Decorrido & Botões de Ação */}
              <div className="lg:col-span-5 flex items-center justify-between lg:justify-end gap-3 pl-0 lg:pl-3 border-t lg:border-t-0 lg:border-l border-white/10 pt-2 lg:pt-0">
                {/* Timer Display */}
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm ${
                    isRose ? 'bg-[#ff2d75]/20 border-[#ff2d75]/40 text-[#ff85b3]' : 'bg-sky-500/20 border-sky-500/30 text-sky-400'
                  }`}>
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <div className={`px-2 py-0.2 rounded-full text-[9px] font-bold border flex items-center gap-1 ${currentStatus.badgeColor}`}>
                        <span className={`w-1 h-1 rounded-full ${currentStatus.dotColor}`} />
                        {currentStatus.label}
                      </div>
                    </div>
                    <div className="text-xl md:text-2xl font-black font-mono tracking-tight text-white leading-tight">
                      {isCountdownMode ? formatTime(remainingSeconds) : formatTime(elapsedSeconds)}
                    </div>
                  </div>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex items-center gap-2">
                  {workoutStatus === 'idle' && (
                    <button
                      type="button"
                      onClick={onStart}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r ${
                        isRose ? 'from-[#9400D3] to-[#ff2d75]' : 'from-emerald-500 to-teal-500'
                      } text-white font-black text-xs md:text-sm tracking-wide shadow-lg active:scale-95 transition-all cursor-pointer`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>INICIAR</span>
                    </button>
                  )}

                  {workoutStatus === 'running' && (
                    <>
                      <button
                        type="button"
                        onClick={onPause}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs tracking-wide active:scale-95 transition-all shadow-md cursor-pointer"
                      >
                        <Pause className="w-4 h-4 fill-current" />
                        <span>PAUSAR</span>
                      </button>

                      <button
                        type="button"
                        onClick={onStop}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-bold text-xs tracking-wide active:scale-95 transition-all shadow-md cursor-pointer ${
                          isRose
                            ? 'bg-rose-500/25 hover:bg-rose-500/35 border-[#ff2d75]/50 text-white'
                            : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>FINALIZAR</span>
                      </button>
                    </>
                  )}

                  {workoutStatus === 'paused' && (
                    <>
                      <button
                        type="button"
                        onClick={onResume}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r ${
                          isRose ? 'from-[#9400D3] to-[#ff2d75]' : 'from-emerald-500 to-teal-500'
                        } text-white font-black text-xs md:text-sm tracking-wide active:scale-95 transition-all shadow-lg cursor-pointer`}
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>RETOMAR</span>
                      </button>

                      <button
                        type="button"
                        onClick={onStop}
                        className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border font-bold text-xs tracking-wide active:scale-95 transition-all shadow-md cursor-pointer ${
                          isRose
                            ? 'bg-rose-500/25 hover:bg-rose-500/35 border-[#ff2d75]/50 text-white'
                            : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>FINALIZAR</span>
                      </button>
                    </>
                  )}

                  {workoutStatus === 'idle' && elapsedSeconds > 0 && (
                    <button
                      type="button"
                      onClick={onReset}
                      className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Zerar cronómetro"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
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
