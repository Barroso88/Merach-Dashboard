import React from 'react';
import { Route, Flame, Gauge, RotateCw } from 'lucide-react';

function IconTile({ icon: Icon, color }) {
  return (
    <span
      className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
      style={{
        background: `linear-gradient(145deg, ${color}33 0%, ${color}12 100%)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px ${color}40, 0 6px 16px -8px ${color}`
      }}
    >
      <Icon className="w-[18px] h-[18px]" style={{ color }} strokeWidth={2.2} />
    </span>
  );
}

function MiniStat({ icon: Icon, label, value, unit, color }) {
  return (
    <div
      className="flex items-center gap-2.5 rounded-xl px-3 py-2"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04), 0 4px 10px -4px rgba(0,0,0,0.7)'
      }}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} />
      <div className="min-w-0 leading-tight">
        <span className="block text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</span>
        <span className="text-[13px] font-semibold tabular-nums text-slate-100">
          {value} <span className="text-[10px] font-medium text-slate-500">{unit}</span>
        </span>
      </div>
    </div>
  );
}

export default function SessionStatsPanel({
  sessionStats,
  workoutStatus = 'idle',
  isRose = false,
  distanceColor = '#38bdf8',
  caloriesColor = '#fbbf24',
  speedAccent = '#38bdf8',
  cadenceAccent = '#10b981'
}) {
  const distanceKm = Number(sessionStats?.distanceKm || 0);
  const caloriesKcal = Number(sessionStats?.caloriesKcal || 0);

  const live = {
    running: { label: 'Ao vivo', dot: 'bg-emerald-400', text: 'text-emerald-300', ping: true },
    paused: { label: 'Em pausa', dot: 'bg-amber-400', text: 'text-amber-300', ping: false },
    idle: { label: 'Pronto', dot: 'bg-slate-500', text: 'text-slate-400', ping: false }
  }[workoutStatus] || { label: 'Pronto', dot: 'bg-slate-500', text: 'text-slate-400', ping: false };

  const labelClass = `text-[11px] font-semibold uppercase tracking-[0.24em] ${isRose ? 'text-pink-200/65' : 'text-slate-400'}`;

  return (
    <div
      className="w-full rounded-[24px] p-px"
      style={{
        background: `linear-gradient(160deg, ${distanceColor}66 0%, rgba(255,255,255,0.07) 32%, rgba(255,255,255,0.04) 68%, ${caloriesColor}66 100%)`,
        boxShadow: '0 2px 3px rgba(0,0,0,0.5), 0 16px 30px -12px rgba(0,0,0,0.8), 0 36px 60px -30px rgba(0,0,0,0.95)'
      }}
    >
      <div
        className="relative rounded-[23px] px-5 py-4 overflow-hidden"
        style={{
          background: isRose
            ? 'linear-gradient(180deg, #33103e 0%, #1d0726 45%, #11031a 100%)'
            : 'linear-gradient(180deg, #1a2436 0%, #111a28 45%, #090e17 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -2px 0 rgba(0,0,0,0.5)'
        }}
      >
        {/* Soft corner light */}
        <div className="absolute -top-16 -left-10 w-44 h-44 rounded-full blur-3xl opacity-[0.12] pointer-events-none" style={{ background: distanceColor }} />
        <div className="absolute -bottom-16 -right-10 w-44 h-44 rounded-full blur-3xl opacity-[0.10] pointer-events-none" style={{ background: caloriesColor }} />

        {/* Header */}
        <div className="relative flex items-center justify-between mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">Sessão</span>
          <span className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${live.text}`}>
            <span className="relative flex w-1.5 h-1.5">
              {live.ping && <span className={`absolute inset-0 rounded-full ${live.dot} animate-ping opacity-75`} />}
              <span className={`relative w-1.5 h-1.5 rounded-full ${live.dot}`} />
            </span>
            {live.label}
          </span>
        </div>

        {/* Distance */}
        <div className="relative flex items-start gap-3.5">
          <IconTile icon={Route} color={distanceColor} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 h-10">
              <span className={labelClass}>Distância</span>
              <span className="flex items-baseline gap-1">
                <span className="text-[2.1rem] font-bold tabular-nums tracking-tight leading-none text-white">{distanceKm.toFixed(1)}</span>
                <span className="text-[11px] font-semibold uppercase" style={{ color: distanceColor }}>km</span>
              </span>
            </div>
          </div>
        </div>

        <div className="relative my-3.5 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

        {/* Calories */}
        <div className="relative flex items-start gap-3.5">
          <IconTile icon={Flame} color={caloriesColor} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 h-10">
              <span className={labelClass}>Calorias</span>
              <span className="flex items-baseline gap-1">
                <span className="text-[2.1rem] font-bold tabular-nums tracking-tight leading-none text-white">{caloriesKcal.toFixed(1)}</span>
                <span className="text-[11px] font-semibold uppercase" style={{ color: caloriesColor }}>kcal</span>
              </span>
            </div>
          </div>
        </div>

        {/* Session peaks */}
        <div className="relative grid grid-cols-2 gap-2 mt-4">
          <MiniStat icon={Gauge} label="Vel. máxima" value={Number(sessionStats?.maxSpeed || 0).toFixed(1)} unit="km/h" color={speedAccent} />
          <MiniStat icon={RotateCw} label="Cad. máxima" value={Number(sessionStats?.maxCadence || 0).toFixed(1)} unit="rpm" color={cadenceAccent} />
        </div>
      </div>
    </div>
  );
}
