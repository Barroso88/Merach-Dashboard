import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, CheckCircle2, X, Gauge, Flame, MapPin, Clock, Save, Trash2, TrendingUp, Sliders } from 'lucide-react';

export default function WorkoutSummaryModal({
  isOpen,
  workoutData,
  themeConfig,
  onSave,
  onDiscard
}) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  const isRose = themeConfig?.id === 'rose';

  useEffect(() => {
    if (isOpen && workoutData) {
      setTitle(workoutData.title || `Treino Merach Bike - ${new Date().toLocaleDateString('pt-PT')}`);
      setNotes('');
      try {
        confetti({
          particleCount: 85,
          spread: 75,
          origin: { y: 0.6 },
          colors: isRose 
            ? ['#f43f5e', '#ec4899', '#e879f9', '#fb7185', '#fda4af'] 
            : ['#38bdf8', '#10b981', '#fbbf24', '#f43f5e']
        });
      } catch (e) {}
    }
  }, [isOpen, workoutData, isRose]);

  if (!isOpen || !workoutData) return null;

  const formatDuration = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs}s`;
  };

  const handleSave = () => {
    onSave({
      ...workoutData,
      title: title.trim() || 'Treino Merach Bike',
      notes: notes.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col backdrop-blur-2xl transition-all duration-500 border ${
        themeConfig?.modalPanelClass || 'bg-slate-950/92 border-sky-500/30'
      }`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg ${
              isRose 
                ? 'bg-gradient-to-br from-[#ff2d75] to-[#9400D3] text-white border-pink-400/50 shadow-[0_0_20px_rgba(255,45,117,0.4)]' 
                : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
            }`}>
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Treino Concluído!</h2>
              <p className={`text-xs ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>
                Estatísticas oficiais da tua sessão na bicicleta Merach.
              </p>
            </div>
          </div>
          <button
            onClick={onDiscard}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isRose 
                ? 'bg-[#380743] hover:bg-[#4d0a5e] text-pink-200 hover:text-white border border-[#ff2d75]/30' 
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-6 py-4 flex-1 pr-1">
          {/* Key Metric Highlights Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className={`rounded-2xl p-3.5 border transition-all ${
              themeConfig?.modalCardClass || 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 text-xs mb-1">
                <Clock className="w-3.5 h-3.5" style={{ color: isRose ? '#ff2d75' : '#38bdf8' }} />
                <span className={isRose ? 'text-pink-300 font-semibold' : 'text-slate-400'}>Duração</span>
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {formatDuration(workoutData.durationSeconds || 0)}
              </div>
            </div>

            <div className={`rounded-2xl p-3.5 border transition-all ${
              themeConfig?.modalCardClass || 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 text-xs mb-1">
                <MapPin className="w-3.5 h-3.5" style={{ color: isRose ? '#ff2d75' : '#10b981' }} />
                <span className={isRose ? 'text-pink-300 font-semibold' : 'text-slate-400'}>Distância</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: isRose ? '#ff2d75' : '#10b981' }}>
                {Number(workoutData.distanceKm || 0).toFixed(1)} <span className="text-xs font-sans opacity-75">km</span>
              </div>
            </div>

            <div className={`rounded-2xl p-3.5 border transition-all ${
              themeConfig?.modalCardClass || 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 text-xs mb-1">
                <Flame className="w-3.5 h-3.5" style={{ color: isRose ? '#9400D3' : '#fbbf24' }} />
                <span className={isRose ? 'text-purple-300 font-semibold' : 'text-slate-400'}>Calorias</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: isRose ? '#9400D3' : '#fbbf24' }}>
                {Number(workoutData.caloriesKcal || 0).toFixed(1)} <span className="text-xs font-sans opacity-75">kcal</span>
              </div>
            </div>

            <div className={`rounded-2xl p-3.5 border transition-all ${
              themeConfig?.modalCardClass || 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5" style={{ color: isRose ? '#ff2d75' : '#38bdf8' }} />
                <span className={isRose ? 'text-pink-300 font-semibold' : 'text-slate-400'}>Velocidade Média</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: isRose ? '#ff2d75' : '#38bdf8' }}>
                {Number(workoutData.avgSpeed || 0).toFixed(1)} <span className="text-xs font-sans opacity-75">km/h</span>
              </div>
              <div className={`text-[10px] mt-0.5 ${isRose ? 'text-pink-300/80' : 'text-slate-500'}`}>
                Pico: {Number(workoutData.maxSpeed || 0).toFixed(1)} km/h
              </div>
            </div>

            <div className={`rounded-2xl p-3.5 border transition-all ${
              themeConfig?.modalCardClass || 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center gap-2 text-xs mb-1">
                <Gauge className="w-3.5 h-3.5" style={{ color: isRose ? '#9400D3' : '#10b981' }} />
                <span className={isRose ? 'text-purple-300 font-semibold' : 'text-slate-400'}>Cadência Média</span>
              </div>
              <div className="text-xl font-bold font-mono" style={{ color: isRose ? '#9400D3' : '#10b981' }}>
                {Number(workoutData.avgCadence || 0).toFixed(1)} <span className="text-xs font-sans opacity-75">RPM</span>
              </div>
              <div className={`text-[10px] mt-0.5 ${isRose ? 'text-purple-300/80' : 'text-slate-500'}`}>
                Pico: {Number(workoutData.maxCadence || 0).toFixed(1)} RPM
              </div>
            </div>
          </div>

          {/* Form inputs for saving */}
          <div className="space-y-3 pt-2">
            <div>
              <label className={`block text-xs font-semibold uppercase mb-1.5 ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>
                Nome da Sessão
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Treino Rápido Merach"
                className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none transition-colors border ${
                  themeConfig?.modalInputClass || 'bg-slate-900/90 border-slate-800 text-white'
                }`}
              />
            </div>

            <div>
              <label className={`block text-xs font-semibold uppercase mb-1.5 ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>
                Notas (Opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Treino fluido, ritmo ágil e bom controlo de cadência."
                rows={2}
                className={`w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-colors resize-none border ${
                  themeConfig?.modalInputClass || 'bg-slate-900/90 border-slate-800 text-white'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className={`flex items-center justify-between gap-3 pt-4 border-t ${
          isRose ? 'border-[#ff2d75]/30' : 'border-slate-800'
        }`}>
          <button
            onClick={onDiscard}
            className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isRose
                ? 'bg-[#380743] hover:bg-[#4d0a5e] text-pink-300 hover:text-white border border-[#ff2d75]/35'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Descartar Sessão
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${
              themeConfig?.primaryButtonGrad || 'from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400'
            } ${
              isRose ? 'text-white' : 'text-slate-950'
            } font-bold text-sm shadow-lg ${
              themeConfig?.primaryButtonShadow || 'shadow-sky-500/20'
            } active:scale-95 transition-all cursor-pointer`}
          >
            <Save className="w-4 h-4" />
            Guardar no Histórico
          </button>
        </div>
      </div>
    </div>
  );
}
