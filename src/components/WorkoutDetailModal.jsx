import React from 'react';
import { X, Calendar, Clock, MapPin, Flame, Gauge, TrendingUp, Sliders, Trash2 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function WorkoutDetailModal({ workout, isOpen, onClose, onDelete, themeConfig }) {
  if (!isOpen || !workout) return null;

  const isRose = themeConfig?.id === 'rose';
  const speedStroke = themeConfig?.chartSpeedStroke || '#38bdf8';
  const cadenceStroke = themeConfig?.chartCadenceStroke || '#10b981';

  const dateObj = new Date(workout.date);
  const formattedDate = dateObj.toLocaleDateString('pt-PT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = dateObj.toLocaleTimeString('pt-PT', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s > 0 ? `${s}s` : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-3xl rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col backdrop-blur-2xl transition-all duration-500 border ${
        themeConfig?.modalPanelClass || 'bg-slate-950/90 border-slate-700/80 shadow-2xl'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isRose ? 'text-[#ff85b3]' : 'text-emerald-400'}`}>
              Registo Oficial Merach
            </span>
            <h2 className="text-xl md:text-2xl font-black text-white mt-0.5">{workout.title}</h2>
            <div className={`flex items-center gap-3 text-xs mt-1 capitalize ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>
              <span className="flex items-center gap-1">
                <Calendar className={`w-3.5 h-3.5 ${isRose ? 'text-pink-400' : 'text-slate-500'}`} />
                {formattedDate} às {formattedTime}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isRose 
                ? 'bg-[#380743] hover:bg-[#4d0a5e] text-pink-200 hover:text-white border border-[#ff2d75]/30' 
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-6 py-5 flex-1 pr-1">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={`p-3.5 rounded-2xl border transition-all ${
              themeConfig?.modalCardClass || 'bg-slate-900/70 border-slate-800'
            }`}>
              <span className={`text-[11px] flex items-center gap-1.5 mb-1 ${isRose ? 'text-pink-300 font-semibold' : 'text-slate-400'}`}>
                <Clock className="w-3.5 h-3.5" style={{ color: isRose ? '#ff2d75' : '#38bdf8' }} /> Duração
              </span>
              <div className="text-xl font-bold font-mono text-white">
                {formatDuration(workout.durationSeconds)}
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border transition-all ${
              themeConfig?.modalCardClass || 'bg-slate-900/70 border-slate-800'
            }`}>
              <span className={`text-[11px] flex items-center gap-1.5 mb-1 ${isRose ? 'text-pink-300 font-semibold' : 'text-slate-400'}`}>
                <MapPin className="w-3.5 h-3.5" style={{ color: isRose ? '#ff2d75' : '#10b981' }} /> Distância
              </span>
              <div className="text-xl font-bold font-mono" style={{ color: isRose ? '#ff2d75' : '#10b981' }}>
                {workout.distanceKm} <span className="text-xs font-sans opacity-75">km</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border transition-all ${
              themeConfig?.modalCardClass || 'bg-slate-900/70 border-slate-800'
            }`}>
              <span className={`text-[11px] flex items-center gap-1.5 mb-1 ${isRose ? 'text-purple-300 font-semibold' : 'text-slate-400'}`}>
                <Flame className="w-3.5 h-3.5" style={{ color: isRose ? '#9400D3' : '#fbbf24' }} /> Calorias
              </span>
              <div className="text-xl font-bold font-mono" style={{ color: isRose ? '#9400D3' : '#fbbf24' }}>
                {workout.caloriesKcal} <span className="text-xs font-sans opacity-75">kcal</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-2xl border transition-all ${
              themeConfig?.modalCardClass || 'bg-slate-900/70 border-slate-800'
            }`}>
              <span className={`text-[11px] flex items-center gap-1.5 mb-1 ${isRose ? 'text-pink-300 font-semibold' : 'text-slate-400'}`}>
                <TrendingUp className="w-3.5 h-3.5" style={{ color: isRose ? '#ff2d75' : '#38bdf8' }} /> Vel. Média
              </span>
              <div className="text-xl font-bold font-mono" style={{ color: isRose ? '#ff2d75' : '#38bdf8' }}>
                {workout.avgSpeed} <span className="text-xs font-sans opacity-75">km/h</span>
              </div>
              <div className={`text-[10px] ${isRose ? 'text-pink-300/80' : 'text-slate-500'}`}>Pico: {workout.maxSpeed} km/h</div>
            </div>
          </div>

          {/* Secondary stats row */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
            themeConfig?.modalCardClass || 'bg-slate-900/50 border-slate-800/80'
          }`}>
            <span className={`text-xs ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>Cadência Média / Pico:</span>
            <span className="text-xs font-bold font-mono" style={{ color: isRose ? '#9400D3' : '#10b981' }}>
              {workout.avgCadence} / {workout.maxCadence} RPM
            </span>
          </div>

          {/* Telemetry Chart for session */}
          {workout.samples && workout.samples.length > 0 && (
            <div className={`p-4 rounded-2xl border ${
              isRose ? 'bg-[#290534]/70 border-[#ff2d75]/35' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-400" />
                Curva de Velocidade e Cadência da Sessão
              </h4>
              <div className="w-full h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={workout.samples} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="detailSpeedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={speedStroke} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={speedStroke} stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="detailCadGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={cadenceStroke} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={cadenceStroke} stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.5} />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis yAxisId="s" stroke={speedStroke} tick={{ fill: speedStroke, fontSize: 10 }} unit="km/h" />
                    <YAxis yAxisId="c" orientation="right" stroke={cadenceStroke} tick={{ fill: cadenceStroke, fontSize: 10 }} unit="RPM" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: isRose ? '#24042e' : '#090d16',
                        borderColor: isRose ? '#ff2d75' : '#334155',
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#fff'
                      }}
                    />
                    <Area yAxisId="s" type="monotone" dataKey="speed" name="Velocidade (km/h)" stroke={speedStroke} fill="url(#detailSpeedGrad)" strokeWidth={2} />
                    <Area yAxisId="c" type="monotone" dataKey="cadence" name="Cadência (RPM)" stroke={cadenceStroke} fill="url(#detailCadGrad)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* User Notes */}
          {workout.notes && (
            <div className={`p-4 rounded-2xl border text-xs ${
              isRose ? 'bg-[#380743]/80 border-[#ff2d75]/35 text-pink-100' : 'bg-slate-900/50 border-slate-800 text-slate-300'
            }`}>
              <span className={`font-bold block mb-1 ${isRose ? 'text-[#ff85b3]' : 'text-slate-300'}`}>Notas da Sessão:</span>
              <p className={`italic leading-relaxed ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>"{workout.notes}"</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between pt-4 border-t ${
          isRose ? 'border-[#ff2d75]/30' : 'border-slate-800'
        }`}>
          <button
            onClick={() => {
              if (window.confirm('Tens a certeza de que queres eliminar este treino do histórico?')) {
                onDelete(workout.id);
                onClose();
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isRose
                ? 'bg-[#380743] hover:bg-rose-950/80 border-[#ff2d75]/40 text-[#ff85b3] hover:text-white'
                : 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/30 text-rose-300'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Eliminar Registo
          </button>

          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isRose
                ? 'bg-[#ff2d75] hover:bg-[#ff4386] text-white shadow-lg shadow-[#ff2d75]/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
