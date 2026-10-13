import React, { useState } from 'react';
import SportNeedleGauge from './SportNeedleGauge';
import SessionStatsPanel from './SessionStatsPanel';
import { accentHairlineStyle } from '../constants/surfaces';
import ChamferPanel from './ChamferPanel';
import WorkoutControls from './WorkoutControls';
import RouteMap from './RouteMap';
import RouteErrorBoundary from './RouteErrorBoundary';
import { Gauge, Map, Navigation, ChevronRight } from 'lucide-react';
import { PRESET_ROUTES } from '../services/routesData';

export default function LiveDashboard({
  telemetry,
  workoutStatus,
  elapsedSeconds,
  targetSeconds = 0,
  onSelectTargetSeconds,
  sessionStats,
  chartHistory,
  themeConfig,
  settings,
  onStart,
  onBeforeStart,
  riderName,
  onPause,
  onResume,
  onStop,
  onReset,
  dashboardMode: controlledMode,
  setDashboardMode: setControlledMode
}) {
  const [internalMode, setInternalMode] = useState('gauges'); // 'gauges' | 'route'
  const dashboardMode = controlledMode !== undefined ? controlledMode : internalMode;
  const setDashboardMode = setControlledMode !== undefined ? setControlledMode : setInternalMode;

  // Dynamic responsive gauge sizing (compact on tablets to avoid scrolling!)
  // iPad landscape (1024–1279px) has vertical room to spare, so gauges grow there for readability
  const computeGaugeSize = () => {
    if (typeof window === 'undefined') return 265;
    if (window.innerWidth < 640) return 205;
    if (window.innerWidth < 1024) return 230;
    if (window.innerWidth < 1280 && window.innerWidth > window.innerHeight) {
      if (window.innerHeight >= 820) return 305;
      if (window.innerHeight >= 740) return 285;
    }
    return 265;
  };
  const [gaugeSize, setGaugeSize] = useState(computeGaugeSize);

  React.useEffect(() => {
    const updateSize = () => setGaugeSize(computeGaugeSize());
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Use themeConfig or fallback to cyan
  const speedAccent = themeConfig?.speedAccent || '#38bdf8';
  const speedZones = themeConfig?.speedZones || [
    { from: 0, to: 18, color: '#64748b' },
    { from: 18, to: 30, color: '#38bdf8' },
    { from: 30, to: 42, color: '#10b981' },
    { from: 42, to: 52, color: '#fbbf24' },
    { from: 52, to: 60, color: '#f43f5e' }
  ];

  const cadenceAccent = themeConfig?.cadenceAccent || '#10b981';
  const cadenceZones = themeConfig?.cadenceZones || [
    { from: 0, to: 65, color: '#64748b' },
    { from: 65, to: 80, color: '#38bdf8' },
    { from: 80, to: 95, color: '#10b981' },
    { from: 95, to: 110, color: '#fbbf24' },
    { from: 110, to: 140, color: '#f43f5e' }
  ];

  const distanceColor = themeConfig?.distanceColor || '#38bdf8';
  const caloriesColor = themeConfig?.caloriesColor || '#fbbf24';

  const isRose = themeConfig?.id === 'rose';

  // In Route mode: Fullscreen immersion with all controls and telemetry overlaid on map!
  if (dashboardMode === 'route') {
    return (
      <div className="fixed inset-0 z-40 w-screen h-screen bg-slate-950 overflow-hidden flex flex-col animate-fadeIn">
        <RouteErrorBoundary>
          <RouteMap
            currentDistanceKm={sessionStats.distanceKm}
            speedKmH={telemetry.speed}
            cadenceRpm={telemetry.cadence}
            caloriesKcal={sessionStats.caloriesKcal}
            elapsedSeconds={elapsedSeconds}
            targetSeconds={targetSeconds}
            themeConfig={themeConfig}
            workoutStatus={workoutStatus}
            onStart={() => (onBeforeStart ? onBeforeStart(onStart) : onStart())}
            onPause={onPause}
            onResume={onResume}
            onStop={onStop}
            onReset={onReset}
            onExitRouteMode={() => setDashboardMode('gauges')}
            googleMapsApiKey={settings?.googleMapsApiKey}
          />
        </RouteErrorBoundary>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 md:space-y-4 tab:space-y-3 animate-fadeIn pb-6 tab:pb-2 max-w-6xl w-full mx-auto flex flex-col items-center">
      {/* Centered Workout Timer & Controls (Visible only in Gauges mode) */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-3xl">
          <WorkoutControls
            status={workoutStatus}
            elapsedSeconds={elapsedSeconds}
            targetSeconds={targetSeconds}
            onSelectTargetSeconds={onSelectTargetSeconds}
            onStart={onStart}
            onBeforeStart={onBeforeStart}
            riderName={riderName}
            onPause={onPause}
            onResume={onResume}
            onStop={onStop}
            onReset={onReset}
            themeConfig={themeConfig}
            cadence={telemetry?.cadence || 0}
          />
        </div>
      </div>

      {/* Cockpit Mode Switcher: Manómetros vs Percurso GPS (hidden on tablet landscape: duplicated in the navbar) */}
      <div className={`flex tab:hidden items-center gap-1.5 p-1 rounded-2xl border backdrop-blur-xl transition-all ${
        isRose ? 'bg-[#290534]/70 border-[#ff2d75]/30' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <button
          type="button"
          onClick={() => setDashboardMode('gauges')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            dashboardMode === 'gauges'
              ? isRose
                ? 'bg-gradient-to-r from-[#9400D3] to-[#ff2d75] text-white shadow-md'
                : 'bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Manómetros & Telemetria</span>
        </button>

        <button
          type="button"
          onClick={() => setDashboardMode('route')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            dashboardMode === 'route'
              ? isRose
                ? 'bg-gradient-to-r from-[#9400D3] to-[#ff2d75] text-white shadow-md'
                : 'bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Percurso Real (Ecrã Completo)</span>
        </button>
      </div>

      {/* Active Route Quick-Access Banner (hidden mid-workout on tablet landscape to keep everything on one screen) */}
      <ChamferPanel
        isRose={isRose}
        accent={speedAccent}
        accent2={cadenceAccent}
        cut={14}
        elevation="low"
        className={`w-full max-w-3xl ${workoutStatus !== 'idle' ? 'tab:hidden' : ''}`}
        innerClassName="px-5 py-2.5 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isRose ? 'bg-[#ff2d75]/20 text-[#ff85b3] border border-[#ff2d75]/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
          }`}>
            <Navigation className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-left">
            <span className="block text-[13px] font-semibold text-white tracking-tight truncate max-w-[220px] sm:max-w-md">
              {PRESET_ROUTES[0]?.name || 'Marginal Estoril ➔ Cascais ➔ Guincho'}
            </span>
            <span className="block text-[10px] font-medium tabular-nums text-slate-400">
              {PRESET_ROUTES[0]?.distanceKm || 12.99} km • +{PRESET_ROUTES[0]?.elevationGain || 95}m D+ • {PRESET_ROUTES[0]?.difficulty || 'Panorâmica'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDashboardMode('route')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
            isRose
              ? 'bg-[#ff2d75]/20 hover:bg-[#ff2d75]/30 text-[#ff85b3] hover:text-white border border-[#ff2d75]/40'
              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white border border-emerald-500/30'
          }`}
          title="Ver percurso no mapa 3D ou escolher/criar outro percurso"
        >
          <Map className="w-3.5 h-3.5" />
          <span>Ver / Alterar Percurso</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </ChamferPanel>

      {/* INSTRUMENT CLUSTER: SPEED | DISTANCE & CALORIES | CADENCE */}
      <ChamferPanel
        isRose={isRose}
        accent={speedAccent}
        accent2={cadenceAccent}
        cut={30}
        className="w-full"
        innerClassName="px-5 py-5 md:px-7 md:py-6 lg:px-9 tab:px-7 tab:py-4 flex flex-col items-center"
      >
        {/* Top accent hairline */}
        <div className="absolute top-0 inset-x-10 h-px pointer-events-none" style={accentHairlineStyle(speedAccent, cadenceAccent)} />
        {/* Soft light pools behind each dial */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none opacity-[0.07] blur-3xl" style={{ background: speedAccent }} />
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none opacity-[0.07] blur-3xl" style={{ background: cadenceAccent }} />

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-center justify-items-center relative z-10">

          {/* 1. Speed */}
          <div className="lg:col-span-4 w-full flex flex-col items-center justify-center">
            <SportNeedleGauge
              value={telemetry.speed}
              min={0}
              max={60}
              majorTickInterval={10}
              minorTickCount={3}
              unit="km/h"
              title="Velocidade"
              zones={speedZones}
              size={gaugeSize}
              accentColor={speedAccent}
              peak={sessionStats.maxSpeed}
              themeConfig={themeConfig}
            />
          </div>

          {/* 2. Centre telemetry */}
          <div className="lg:col-span-4 w-full max-w-sm flex flex-col items-center justify-center">
            <SessionStatsPanel
              sessionStats={sessionStats}
              workoutStatus={workoutStatus}
              isRose={isRose}
              distanceColor={distanceColor}
              caloriesColor={caloriesColor}
              speedAccent={speedAccent}
              cadenceAccent={cadenceAccent}
            />
          </div>

          {/* 3. Cadence */}
          <div className="lg:col-span-4 w-full flex flex-col items-center justify-center">
            <SportNeedleGauge
              value={telemetry.cadence}
              min={0}
              max={140}
              majorTickInterval={20}
              minorTickCount={3}
              unit="rpm"
              title="Cadência"
              zones={cadenceZones}
              size={gaugeSize}
              accentColor={cadenceAccent}
              peak={sessionStats.maxCadence}
              themeConfig={themeConfig}
            />
          </div>

        </div>
      </ChamferPanel>
    </div>
  );
}
