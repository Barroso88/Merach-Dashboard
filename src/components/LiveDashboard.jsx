import React, { useState } from 'react';
import SportNeedleGauge from './SportNeedleGauge';
import LiveChart from './LiveChart';
import WorkoutControls from './WorkoutControls';
import RouteMap from './RouteMap';
import { Gauge, Map } from 'lucide-react';

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
  onPause,
  onResume,
  onStop,
  onReset
}) {
  const [dashboardMode, setDashboardMode] = useState('gauges'); // 'gauges' | 'route'

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
  const glowColor = themeConfig?.glowColor || 'rgba(56, 189, 248, 0.15)';

  const isRose = themeConfig?.id === 'rose';

  return (
    <div className="space-y-6 animate-fadeIn pb-16 md:pb-8 max-w-6xl mx-auto flex flex-col items-center">
      {/* Centered Workout Timer & Controls */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-3xl">
          <WorkoutControls
            status={workoutStatus}
            elapsedSeconds={elapsedSeconds}
            targetSeconds={targetSeconds}
            onSelectTargetSeconds={onSelectTargetSeconds}
            onStart={onStart}
            onPause={onPause}
            onResume={onResume}
            onStop={onStop}
            onReset={onReset}
            themeConfig={themeConfig}
          />
        </div>
      </div>

      {/* Cockpit Mode Switcher: Manómetros vs Percurso GPS */}
      <div className={`flex items-center gap-1.5 p-1.5 rounded-2xl border backdrop-blur-xl transition-all ${
        isRose ? 'bg-[#290534]/70 border-[#ff2d75]/30' : 'bg-slate-900/80 border-slate-800'
      }`}>
        <button
          type="button"
          onClick={() => setDashboardMode('gauges')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            dashboardMode === 'route'
              ? isRose
                ? 'bg-gradient-to-r from-[#9400D3] to-[#ff2d75] text-white shadow-md'
                : 'bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Map className="w-3.5 h-3.5" />
          <span>Percurso Real (Visão Satélite Frontal)</span>
        </button>
      </div>

      {dashboardMode === 'route' ? (
        <div className="w-full">
          <RouteMap
            currentDistanceKm={sessionStats.distanceKm}
            speedKmH={telemetry.speed}
            cadenceRpm={telemetry.cadence}
            themeConfig={themeConfig}
            workoutStatus={workoutStatus}
            googleMapsApiKey={settings?.googleMapsApiKey}
          />
        </div>
      ) : (
        <>
          {/* CLUSTER UNIFICADO PREMIUM: GAUGES COM DISTÂNCIA E CALORIAS INTEGRADAS NO MESMO PAINEL */}
      <div 
        className="w-full rounded-[36px] p-6 lg:p-10 relative overflow-hidden flex flex-col items-center transition-all duration-700"
        style={{
          background: themeConfig?.clusterBg || 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(8, 12, 20, 0.95) 50%, rgba(5, 8, 14, 0.98) 100%)',
          backdropFilter: 'blur(25px)',
          WebkitBackdropFilter: 'blur(25px)',
          border: `1px solid ${themeConfig?.clusterBorder || 'rgba(255, 255, 255, 0.1)'}`,
          boxShadow: themeConfig?.clusterShadow || `0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 0 35px -5px ${glowColor}`
        }}
      >
        {/* Carbon Fibre Pattern Background */}
        <div 
          className="absolute inset-0 opacity-25 pointer-events-none transition-all duration-700"
          style={{
            backgroundImage: isRose 
              ? `radial-gradient(#4a1538 1.2px, transparent 1.2px), radial-gradient(#4a1538 1.2px, #0e0410 1.2px)`
              : `radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, #080c14 1px)`,
            backgroundSize: '18px 18px',
            backgroundPosition: '0 0, 9px 9px'
          }}
        />

        {/* Ambient Top Glow Line matching theme */}
        <div 
          className="absolute top-0 left-1/4 right-1/4 h-[1px]" 
          style={{
            background: `linear-gradient(to right, transparent, ${speedAccent}90, ${cadenceAccent}90, transparent)`
          }}
        />

        {/* 4 Titanium Screws in Corner Facets */}
        <div className={`absolute top-4 left-4 w-2 h-2 rounded-full border shadow-sm ${isRose ? 'bg-pink-900 border-pink-700/70' : 'bg-slate-600 border-slate-500/70'}`} />
        <div className={`absolute top-4 right-4 w-2 h-2 rounded-full border shadow-sm ${isRose ? 'bg-pink-900 border-pink-700/70' : 'bg-slate-600 border-slate-500/70'}`} />
        <div className={`absolute bottom-4 left-4 w-2 h-2 rounded-full border shadow-sm ${isRose ? 'bg-pink-900 border-pink-700/70' : 'bg-slate-600 border-slate-500/70'}`} />
        <div className={`absolute bottom-4 right-4 w-2 h-2 rounded-full border shadow-sm ${isRose ? 'bg-pink-900 border-pink-700/70' : 'bg-slate-600 border-slate-500/70'}`} />

        {/* MAIN INTEGRATED CLUSTER: SPEEDOMETER | DIGITAL TELEMETRY CORE (DIST & CAL) | CADENCE */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center justify-items-center relative z-10">
          
          {/* 1. MANÓMETRO DE VELOCIDADE (Esquerda) */}
          <div className="lg:col-span-4 w-full flex flex-col items-center justify-center">
            <SportNeedleGauge
              value={telemetry.speed}
              min={0}
              max={60}
              majorTickInterval={10}
              minorTickCount={3}
              unit="km/h"
              title="VELOCIDADE"
              zones={speedZones}
              size={290}
              accentColor={speedAccent}
              themeConfig={themeConfig}
            />
          </div>

          {/* 2. HUD CENTRAL DE TELEMETRIA: DISTÂNCIA & CALORIAS (Centro) */}
          <div className="lg:col-span-4 w-full max-w-sm flex flex-col items-center justify-center lg:pt-[50px]">
            <div 
              className="w-full rounded-3xl p-6 border transition-all relative overflow-hidden"
              style={{
                background: themeConfig?.hudCardBg || 'linear-gradient(180deg, rgba(12, 18, 30, 0.95) 0%, rgba(6, 10, 18, 0.98) 100%)',
                borderColor: themeConfig?.hudCardBorder || `${speedAccent}35`,
                boxShadow: isRose 
                  ? 'inset 0 0 25px rgba(0, 0, 0, 0.9), 0 10px 30px -5px rgba(244,63,94,0.35)' 
                  : 'inset 0 0 25px rgba(0, 0, 0, 0.9), 0 10px 30px -5px rgba(0,0,0,0.6)'
              }}
            >
              {/* Subtle vertical accent glow line matching theme */}
              <div 
                className="absolute top-0 left-0 right-0 h-1" 
                style={{
                  background: `linear-gradient(to right, ${speedAccent}90, ${caloriesColor}90, ${cadenceAccent}90)`
                }}
              />

              {/* Bloco 1: DISTÂNCIA PERCORRIDA */}
              <div className={`flex items-center justify-between p-4 rounded-2xl border mb-3 transition-colors ${
                themeConfig?.metricItemBg || 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
              }`}>
                <span 
                  className="text-xs lg:text-sm font-black uppercase tracking-[0.25em] font-mono text-white"
                  style={{
                    textShadow: `0 0 10px ${distanceColor}, 0 0 22px ${distanceColor}95, 0 0 35px ${distanceColor}50`
                  }}
                >
                  DISTÂNCIA
                </span>

                <div className="flex items-baseline gap-1 text-right">
                  <span 
                    className="text-3xl font-black font-mono tracking-tight text-white"
                    style={{ textShadow: `0 0 15px ${distanceColor}60` }}
                  >
                    {sessionStats.distanceKm}
                  </span>
                  <span className="text-xs font-bold font-mono" style={{ color: distanceColor }}>km</span>
                </div>
              </div>

              {/* Bloco 2: CALORIAS GASTAS */}
              <div className={`flex items-center justify-between p-4 rounded-2xl border transition-colors ${
                themeConfig?.metricItemBg || 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700'
              }`}>
                <span 
                  className="text-xs lg:text-sm font-black uppercase tracking-[0.25em] font-mono text-white"
                  style={{
                    textShadow: `0 0 10px ${caloriesColor}, 0 0 22px ${caloriesColor}95, 0 0 35px ${caloriesColor}50`
                  }}
                >
                  CALORIAS
                </span>

                <div className="flex items-baseline gap-1 text-right">
                  <span 
                    className="text-3xl font-black font-mono tracking-tight"
                    style={{ 
                      color: caloriesColor,
                      textShadow: `0 0 15px ${caloriesColor}60` 
                    }}
                  >
                    {sessionStats.caloriesKcal}
                  </span>
                  <span className="text-xs font-bold font-mono" style={{ color: caloriesColor }}>kcal</span>
                </div>
              </div>

              {/* Optional Advanced Merach Bike Sensors (Power, Resistance, Heart Rate) */}
              {(settings?.haEntities?.power || settings?.haEntities?.resistance || settings?.haEntities?.heartRate || telemetry?.power > 0 || telemetry?.resistance > 0 || telemetry?.heartRate > 0) && (
                <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/10 text-center font-mono animate-fadeIn">
                  {/* Potência */}
                  <div className="p-1.5 rounded-xl bg-white/5 border border-amber-500/30">
                    <span className="block text-[8px] font-bold text-amber-300 uppercase tracking-wider">Potência</span>
                    <span className="text-sm font-black text-white">{telemetry?.power ?? 0} <span className="text-[9px] text-amber-300">W</span></span>
                  </div>
                  {/* Resistência */}
                  <div className="p-1.5 rounded-xl bg-white/5 border border-purple-500/30">
                    <span className="block text-[8px] font-bold text-purple-300 uppercase tracking-wider">Resist.</span>
                    <span className="text-sm font-black text-white">{telemetry?.resistance ?? '--'} <span className="text-[9px] text-purple-300">Nv</span></span>
                  </div>
                  {/* Frequência Cardíaca */}
                  <div className="p-1.5 rounded-xl bg-white/5 border border-rose-500/30">
                    <span className="block text-[8px] font-bold text-rose-300 uppercase tracking-wider">Pulso</span>
                    <span className="text-sm font-black text-white">{telemetry?.heartRate ?? '--'} <span className="text-[9px] text-rose-300">bpm</span></span>
                  </div>
                </div>
              )}

              {/* Micro Telemetry Footer inside the Center HUD */}
              <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1">
                  <span>Pico Vel:</span>
                  <strong className="text-white">{sessionStats.maxSpeed} km/h</strong>
                </div>
                <div className="flex items-center gap-1">
                  <span>Pico Cad:</span>
                  <strong style={{ color: cadenceAccent }}>{sessionStats.maxCadence} RPM</strong>
                </div>
              </div>
            </div>
          </div>

          {/* 3. MANÓMETRO DE CADÊNCIA (Direita) */}
          <div className="lg:col-span-4 w-full flex flex-col items-center justify-center">
            <SportNeedleGauge
              value={telemetry.cadence}
              min={0}
              max={140}
              majorTickInterval={20}
              minorTickCount={3}
              unit="RPM"
              title="CADÊNCIA"
              zones={cadenceZones}
              size={290}
              accentColor={cadenceAccent}
              themeConfig={themeConfig}
            />
          </div>

        </div>
      </div>

      {/* Gráfico Dinâmico Centralizado */}
      <div className="w-full max-w-4xl">
        <LiveChart 
          data={chartHistory} 
          speedColor={speedAccent}
          cadenceColor={cadenceAccent}
        />
      </div>
    </>
  )}
</div>
  );
}
