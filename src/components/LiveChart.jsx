import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { LineChart as ChartIcon, Gauge, TrendingUp } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-xl border border-slate-700/80 shadow-2xl text-xs space-y-1 font-mono">
        <div className="text-slate-400 font-sans font-semibold border-b border-slate-800 pb-1 mb-1">
          Tempo: {label}
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 font-sans" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-bold text-white">
              {entry.value} {entry.unit}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function LiveChart({ 
  data = [],
  speedColor = '#38bdf8',
  cadenceColor = '#10b981'
}) {
  const [visibleMetric, setVisibleMetric] = useState('both'); // 'both', 'speed', 'cadence'

  // Calculate live stats
  const speedValues = data.map(d => d.speed || 0).filter(v => v > 0);
  const cadenceValues = data.map(d => d.cadence || 0).filter(v => v > 0);

  const avgSpeed = speedValues.length 
    ? Number((speedValues.reduce((a, b) => a + b, 0) / speedValues.length).toFixed(1))
    : 0;
  const maxSpeed = speedValues.length ? Math.max(...speedValues) : 0;
  const avgCadence = cadenceValues.length 
    ? Math.round(cadenceValues.reduce((a, b) => a + b, 0) / cadenceValues.length) 
    : 0;
  const maxCadence = cadenceValues.length ? Math.max(...cadenceValues) : 0;

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ 
              backgroundColor: `${speedColor}15`, 
              border: `1px solid ${speedColor}30`, 
              color: speedColor 
            }}
          >
            <ChartIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Telemetria em Tempo Real</h3>
            <p className="text-xs text-slate-400">Evolução contínua de Velocidade e Cadência</p>
          </div>
        </div>

        {/* View toggle filters */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setVisibleMetric('both')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              visibleMetric === 'both'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Ambos
          </button>
          <button
            onClick={() => setVisibleMetric('speed')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
            style={{
              backgroundColor: visibleMetric === 'speed' ? `${speedColor}20` : 'transparent',
              borderColor: visibleMetric === 'speed' ? `${speedColor}40` : 'transparent',
              color: visibleMetric === 'speed' ? speedColor : '#94a3b8'
            }}
          >
            <TrendingUp className="w-3 h-3" />
            Velocidade
          </button>
          <button
            onClick={() => setVisibleMetric('cadence')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
            style={{
              backgroundColor: visibleMetric === 'cadence' ? `${cadenceColor}20` : 'transparent',
              borderColor: visibleMetric === 'cadence' ? `${cadenceColor}40` : 'transparent',
              color: visibleMetric === 'cadence' ? cadenceColor : '#94a3b8'
            }}
          >
            <Gauge className="w-3 h-3" />
            Cadência
          </button>
        </div>
      </div>

      {/* Mini Session Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Velocidade Média:</span>
          <span className="text-xs font-bold font-mono" style={{ color: speedColor }}>{avgSpeed} km/h</span>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Velocidade Pico:</span>
          <span className="text-xs font-bold font-mono text-white">{maxSpeed} km/h</span>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Cadência Média:</span>
          <span className="text-xs font-bold font-mono" style={{ color: cadenceColor }}>{avgCadence} RPM</span>
        </div>
        <div className="bg-slate-900/60 rounded-xl p-2.5 border border-slate-800/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Cadência Pico:</span>
          <span className="text-xs font-bold font-mono text-white">{maxCadence} RPM</span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-64 lg:h-72 mt-1">
        {data.length < 2 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2 border border-dashed border-slate-800 rounded-2xl">
            <Gauge className="w-6 h-6 text-slate-600 animate-pulse" />
            <p className="text-xs">Aguardando início do treino para traçar a curva de velocidade e cadência...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="speedNeonGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={speedColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={speedColor} stopOpacity={0.0} />
                </linearGradient>

                <linearGradient id="cadenceNeonGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={cadenceColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={cadenceColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickLine={false}
              />

              {/* Left Y Axis for Speed */}
              {(visibleMetric === 'both' || visibleMetric === 'speed') && (
                <YAxis
                  yAxisId="speed"
                  orientation="left"
                  stroke={speedColor}
                  domain={[0, 60]}
                  tick={{ fill: speedColor, fontSize: 10 }}
                  tickLine={false}
                  unit="km/h"
                />
              )}

              {/* Right Y Axis for Cadence */}
              {(visibleMetric === 'both' || visibleMetric === 'cadence') && (
                <YAxis
                  yAxisId="cadence"
                  orientation={visibleMetric === 'cadence' ? 'left' : 'right'}
                  stroke={cadenceColor}
                  domain={[0, 140]}
                  tick={{ fill: cadenceColor, fontSize: 10 }}
                  tickLine={false}
                  unit="RPM"
                />
              )}

              <Tooltip content={<CustomTooltip />} />

              {(visibleMetric === 'both' || visibleMetric === 'speed') && (
                <Area
                  yAxisId="speed"
                  type="monotone"
                  dataKey="speed"
                  name="Velocidade"
                  unit="km/h"
                  stroke={speedColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#speedNeonGradient)"
                  isAnimationActive={false}
                />
              )}

              {(visibleMetric === 'both' || visibleMetric === 'cadence') && (
                <Area
                  yAxisId="cadence"
                  type="monotone"
                  dataKey="cadence"
                  name="Cadência"
                  unit="RPM"
                  stroke={cadenceColor}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cadenceNeonGradient)"
                  isAnimationActive={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
