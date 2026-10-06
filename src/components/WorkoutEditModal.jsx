import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Flame,
  Gauge,
  Activity,
  FileText,
  Save,
  CheckCircle2,
  PlusCircle,
  Edit3
} from 'lucide-react';

export default function WorkoutEditModal({
  isOpen,
  onClose,
  workout = null, // null for new workout, or workout object for editing
  onSave,
  themeConfig
}) {
  const isRose = themeConfig?.id === 'rose';
  const isEditing = !!workout;

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    dateTime: '',
    durationMinutes: 30,
    durationSeconds: 0,
    distanceKm: 10.0,
    caloriesKcal: 250,
    avgSpeed: 20.0,
    maxSpeed: 26.0,
    avgCadence: 75,
    maxCadence: 90,
    notes: ''
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (workout) {
      // Editing existing workout
      const d = workout.date ? new Date(workout.date) : new Date();
      // Format as YYYY-MM-DDTHH:MM for datetime-local
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const localIso = `${year}-${month}-${day}T${hours}:${minutes}`;

      const totalSec = workout.durationSeconds || 0;
      setFormData({
        title: workout.title || 'Treino Merach Bike',
        dateTime: localIso,
        durationMinutes: Math.floor(totalSec / 60),
        durationSeconds: totalSec % 60,
        distanceKm: Number(workout.distanceKm || 0),
        caloriesKcal: Math.round(workout.caloriesKcal || 0),
        avgSpeed: Number(workout.avgSpeed || 0),
        maxSpeed: Number(workout.maxSpeed || workout.avgSpeed || 0),
        avgCadence: Math.round(workout.avgCadence || 0),
        maxCadence: Math.round(workout.maxCadence || workout.avgCadence || 0),
        notes: workout.notes || ''
      });
    } else {
      // Adding new manual workout
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const localIso = `${year}-${month}-${day}T${hours}:${minutes}`;

      setFormData({
        title: 'Treino Merach Bike Manual',
        dateTime: localIso,
        durationMinutes: 30,
        durationSeconds: 0,
        distanceKm: 10.0,
        caloriesKcal: 250,
        avgSpeed: 20.0,
        maxSpeed: 26.0,
        avgCadence: 75,
        maxCadence: 90,
        notes: ''
      });
    }
  }, [workout, isOpen]);

  // Handle auto-calculating average speed when duration and distance change
  const handleRecalculateSpeed = (dist, mins, secs) => {
    const totalHours = (Number(mins) * 60 + Number(secs)) / 3600;
    if (totalHours > 0 && Number(dist) > 0) {
      const calcSpeed = Number((Number(dist) / totalHours).toFixed(1));
      setFormData(prev => ({
        ...prev,
        avgSpeed: calcSpeed,
        maxSpeed: Math.max(prev.maxSpeed, Number((calcSpeed * 1.25).toFixed(1)))
      }));
    }
  };

  const handleSave = (e) => {
    e.preventDefault();

    const totalSeconds = (Number(formData.durationMinutes) || 0) * 60 + (Number(formData.durationSeconds) || 0);
    const dateObj = formData.dateTime ? new Date(formData.dateTime) : new Date();

    const updatedWorkout = {
      ...(workout || {}),
      id: workout?.id || `wo-${Date.now()}`,
      title: formData.title.trim() || 'Treino Merach Bike',
      date: dateObj.toISOString(),
      durationSeconds: Math.max(1, totalSeconds),
      distanceKm: Number(Number(formData.distanceKm || 0).toFixed(2)),
      caloriesKcal: Math.round(Number(formData.caloriesKcal || 0)),
      avgSpeed: Number(Number(formData.avgSpeed || 0).toFixed(1)),
      maxSpeed: Number(Number(formData.maxSpeed || formData.avgSpeed || 0).toFixed(1)),
      avgCadence: Math.round(Number(formData.avgCadence || 0)),
      maxCadence: Math.round(Number(formData.maxCadence || formData.avgCadence || 0)),
      notes: formData.notes.trim(),
      samples: workout?.samples && workout.samples.length > 0 ? workout.samples : [
        { time: '0m', cadence: Number(formData.avgCadence), speed: Number(formData.avgSpeed) },
        { time: `${Math.round(totalSeconds / 60)}m`, cadence: Number(formData.avgCadence), speed: Number(formData.avgSpeed) }
      ]
    };

    setSaveSuccess(true);
    setTimeout(() => {
      onSave(updatedWorkout);
      setSaveSuccess(false);
      onClose();
    }, 400);
  };

  const inputClass = isRose
    ? 'bg-[#1b0323] border-[#ff2d75]/40 text-white focus:border-[#ff2d75] focus:ring-[#ff2d75]/30'
    : 'bg-slate-900 border-slate-700 text-white focus:border-sky-500 focus:ring-sky-500/30';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col backdrop-blur-2xl transition-all duration-500 border ${
        themeConfig?.modalPanelClass || 'bg-slate-950/95 border-slate-700/80 shadow-2xl'
      }`}>
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-lg ${
              isRose ? 'bg-[#ff2d75]/20 border-[#ff2d75]/50 text-[#ff85b3]' : 'bg-sky-500/20 border-sky-500/40 text-sky-400'
            }`}>
              {isEditing ? <Edit3 className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                {isEditing ? 'Editar Dados do Treino' : 'Adicionar Treino Manual'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Corrige a duração, distância ou calorias deste registo.' : 'Regista manualmente um treino que não tenha sido contabilizado.'}
              </p>
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="overflow-y-auto space-y-4 py-4 flex-1 pr-1 font-sans">
          {/* Workout Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-sky-400" />
              Título / Nome do Treino:
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold transition-all outline-none ${inputClass}`}
              placeholder="ex: Treino Merach Bike - 20km Sprint"
            />
          </div>

          {/* Date & Time */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Data e Hora:
            </label>
            <input
              type="datetime-local"
              required
              value={formData.dateTime}
              onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition-all outline-none ${inputClass}`}
            />
          </div>

          {/* Duration (Minutes & Seconds) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Duração (Minutos):
              </label>
              <input
                type="number"
                min="0"
                max="999"
                required
                value={formData.durationMinutes}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, durationMinutes: val }));
                  handleRecalculateSpeed(formData.distanceKm, val, formData.durationSeconds);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold transition-all outline-none ${inputClass}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Segundos:
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={formData.durationSeconds}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, durationSeconds: val }));
                  handleRecalculateSpeed(formData.distanceKm, formData.durationMinutes, val);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition-all outline-none ${inputClass}`}
              />
            </div>
          </div>

          {/* Distance & Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Distância (km):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.distanceKm}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData(prev => ({ ...prev, distanceKm: val }));
                  handleRecalculateSpeed(val, formData.durationMinutes, formData.durationSeconds);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold transition-all outline-none ${inputClass}`}
                placeholder="ex: 15.4"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Calorias (kcal):
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.caloriesKcal}
                onChange={(e) => setFormData({ ...formData, caloriesKcal: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold transition-all outline-none ${inputClass}`}
                placeholder="ex: 340"
              />
            </div>
          </div>

          {/* Speed (Average & Maximum) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
                Velocidade Média (km/h):
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.avgSpeed}
                onChange={(e) => setFormData({ ...formData, avgSpeed: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold transition-all outline-none ${inputClass}`}
                placeholder="ex: 24.5"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Velocidade Máxima (km/h):
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.maxSpeed}
                onChange={(e) => setFormData({ ...formData, maxSpeed: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition-all outline-none ${inputClass}`}
                placeholder="ex: 32.0"
              />
            </div>
          </div>

          {/* Cadence (Average & Maximum) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Cadência Média (RPM):
              </label>
              <input
                type="number"
                min="0"
                value={formData.avgCadence}
                onChange={(e) => setFormData({ ...formData, avgCadence: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold transition-all outline-none ${inputClass}`}
                placeholder="ex: 78"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Cadência Máxima (RPM):
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxCadence}
                onChange={(e) => setFormData({ ...formData, maxCadence: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition-all outline-none ${inputClass}`}
                placeholder="ex: 95"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Observações / Notas da Sessão (Opcional):
            </label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-sans transition-all outline-none ${inputClass}`}
              placeholder="ex: Treino de recuperação, dados corrigidos manualmente."
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                isRose
                  ? 'bg-[#380743] hover:bg-[#4d0a5e] text-pink-200 border border-[#ff2d75]/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saveSuccess}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer ${
                saveSuccess
                  ? 'bg-emerald-500 text-white'
                  : isRose
                    ? 'bg-gradient-to-r from-[#9400D3] to-[#ff2d75] hover:opacity-95 text-white shadow-[#ff2d75]/30'
                    : 'bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 shadow-sky-500/20'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                  <span>Guardado com Sucesso!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'Guardar Alterações' : 'Criar Registo'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
