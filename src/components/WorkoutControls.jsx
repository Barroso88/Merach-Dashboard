import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer,
  Hourglass,
  Sun,
  ImagePlus
} from 'lucide-react';
import LaunchCountdownOverlay from './LaunchCountdownOverlay';
import GoalTrack from './GoalTrack';
import { premiumSurfaceStyle, accentHairlineStyle } from '../constants/surfaces';

// Each duration has its own colour (cool → hot as the ride gets longer)
const COUNTDOWN_PRESETS = [
  { id: 'free', label: 'Livre', seconds: 0, tag: 'Sem limite', from: '#94a3b8', to: '#475569' },
  { id: '5m', label: '5 min', seconds: 300, tag: 'Sprint', from: '#38bdf8', to: '#0369a1' },
  { id: '10m', label: '10 min', seconds: 600, tag: 'Express', from: '#34d399', to: '#047857' },
  { id: '15m', label: '15 min', seconds: 900, tag: 'Cardio', from: '#a3e635', to: '#4d7c0f' },
  { id: '20m', label: '20 min', seconds: 1200, tag: 'Queima', from: '#facc15', to: '#a16207' },
  { id: '30m', label: '30 min', seconds: 1800, tag: 'Endurance', from: '#fb923c', to: '#c2410c' },
  { id: '45m', label: '45 min', seconds: 2700, tag: 'Pro Ride', from: '#f43f5e', to: '#9f1239' },
  { id: '60m', label: '60 min', seconds: 3600, tag: 'Desafio', from: '#a78bfa', to: '#6d28d9' }
];

export default function WorkoutControls({
  status, // 'idle' | 'running' | 'paused'
  elapsedSeconds = 0,
  targetSeconds = 0,
  onSelectTargetSeconds,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  themeConfig,
  cadence = 0
}) {
  const [showLaunchOverlay, setShowLaunchOverlay] = useState(false);
  const [displayMode, setDisplayMode] = useState('countdown'); // 'countdown' | 'elapsed'
  const fileInputRef = useRef(null);
  const [customGif, setCustomGif] = useState(() => {
    try {
      return localStorage.getItem('merach_cyclist_gif') || null;
    } catch {
      return null;
    }
  });

  const handleGifUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomGif(reader.result);
        try {
          localStorage.setItem('merach_cyclist_gif', reader.result);
        } catch (err) {
          console.warn('Could not store gif in localStorage', err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetGif = (e) => {
    e.stopPropagation();
    setCustomGif(null);
    try {
      localStorage.removeItem('merach_cyclist_gif');
    } catch {}
  };

  const accentColor = themeConfig?.speedAccent || '#38bdf8';
  const primaryGradient = themeConfig?.primaryButtonGrad || 'from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400';
  const primaryShadow = themeConfig?.primaryButtonShadow || 'shadow-emerald-500/25 hover:shadow-emerald-500/40';

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
  // Free rides loop the track every 30 minutes (one "lap")
  const LAP_SECONDS = 1800;
  const progressExact = isCountdownMode
    ? Math.min(100, (elapsedSeconds / targetSeconds) * 100)
    : ((elapsedSeconds % LAP_SECONDS) / LAP_SECONDS) * 100;
  const lapNumber = Math.floor(elapsedSeconds / LAP_SECONDS) + 1;

  const handleInitiateStart = () => {
    setShowLaunchOverlay(true);
  };

  const handleLaunchComplete = () => {
    setShowLaunchOverlay(false);
    onStart();
  };

  const handleLaunchSkip = () => {
    setShowLaunchOverlay(false);
    onStart();
  };

  const isRose = themeConfig?.id === 'rose';

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

  const currentStatus = statusConfig[status] || statusConfig.idle;

  return (
    <>
      {/* 3-2-1 Launch Racing Overlay */}
      <LaunchCountdownOverlay
        isOpen={showLaunchOverlay}
        onComplete={handleLaunchComplete}
        onSkip={handleLaunchSkip}
        themeConfig={themeConfig}
      />

      <div
        className="rounded-[28px] px-4 py-4 md:px-6 md:py-5 tab:py-3.5 flex flex-col gap-3.5 md:gap-4 tab:gap-2.5 relative overflow-hidden transition-colors duration-500"
        style={premiumSurfaceStyle(isRose, accentColor)}
      >
        {/* Top accent hairline */}
        <div className="absolute top-0 inset-x-10 h-px pointer-events-none" style={accentHairlineStyle(accentColor)} />

        {/* Rider image picker (corner) */}
        {status !== 'idle' && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/gif,image/png,image/webp"
              className="hidden"
              onChange={handleGifUpload}
            />
            {customGif && (
              <button
                type="button"
                onClick={handleResetGif}
                title="Repor ciclista padrão"
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Trocar imagem do ciclista (GIF/PNG)"
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ImagePlus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TOP: DURATION SELECTOR (idle only) */}
        {status === 'idle' && (
          <div className="w-full flex flex-col gap-2.5">
            <div className="flex items-center justify-between px-1">
              <span className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] ${isRose ? 'text-pink-200/60' : 'text-slate-400'}`}>
                <Hourglass className="w-3 h-3" />
                Duração do treino
              </span>
              <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isRose ? 'text-pink-200/50' : 'text-slate-500'}`}>
                {targetSeconds === 0 ? 'Tempo livre' : `Meta · ${targetSeconds / 60} min`}
              </span>
            </div>

            <div
              className="grid grid-cols-4 md:grid-cols-8 gap-1 p-1 rounded-2xl"
              style={{
                background: 'rgba(0,0,0,0.28)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)'
              }}
            >
              {COUNTDOWN_PRESETS.map((preset) => {
                const isSelected = targetSeconds === preset.seconds;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectTargetSeconds && onSelectTargetSeconds(preset.seconds)}
                    className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      isSelected ? 'text-white scale-[1.04] z-[1]' : 'text-slate-100 hover:brightness-125'
                    }`}
                    style={isSelected ? {
                      background: `linear-gradient(160deg, ${preset.from} 0%, ${preset.to} 100%)`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 0 0 1px ${preset.from}, 0 8px 20px -8px ${preset.from}`
                    } : {
                      background: `linear-gradient(160deg, ${preset.from}55 0%, ${preset.to}40 100%)`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${preset.from}59`
                    }}
                  >
                    <span className="text-[13px] font-semibold tabular-nums tracking-tight">{preset.label}</span>
                    <span
                      className="text-[9px] font-medium tracking-wide mt-0.5"
                      style={{ color: isSelected ? 'rgba(255,255,255,0.85)' : `${preset.from}` , filter: isSelected ? undefined : 'brightness(1.25)' }}
                    >
                      {preset.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* CENTRE: HERO TIMER + CONTROLS BELOW */}
        <div className="w-full flex flex-col items-center text-center gap-2.5 md:gap-3 tab:gap-2">
          {/* Label + live status */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span
              className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] ${isRose ? 'text-pink-200/60' : 'text-slate-400'}`}
            >
              {isCountdownMode ? <Hourglass className="w-3.5 h-3.5" /> : <Timer className="w-3.5 h-3.5" />}
              {isCountdownMode && displayMode === 'countdown' ? 'Tempo Restante' : 'Tempo Decorrido'}
            </span>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${currentStatus.badgeColor}`}>
              <span className="relative flex w-1.5 h-1.5">
                <span className={`absolute inset-0 rounded-full ${currentStatus.dotColor}`} />
                <span className={`relative w-1.5 h-1.5 rounded-full ${currentStatus.dotColor.replace(' animate-ping', '')}`} />
              </span>
              {currentStatus.label}
            </span>

            {status === 'running' && (
              <span
                className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  isRose ? 'bg-[#ff2d75]/15 border-[#ff2d75]/40 text-pink-200' : 'bg-amber-500/10 border-amber-500/25 text-amber-300/90'
                }`}
                title="Screen Wake Lock ativo: o ecrã não se apaga por inatividade durante o treino"
              >
                <Sun className="w-3 h-3" />
                Ecrã Ativo
              </span>
            )}
          </div>

          {/* Hero time */}
          <div className="relative px-6">
            <div
              className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2/3 rounded-full blur-3xl pointer-events-none transition-opacity duration-700"
              style={{ background: accentColor, opacity: status === 'running' ? 0.14 : 0.06 }}
            />
            <div
              className={`relative font-bold tabular-nums leading-none tracking-[-0.035em] text-[3.75rem] md:text-[5rem] transition-opacity ${
                status === 'idle' ? 'tab:text-[3.25rem]' : 'tab:text-[4.25rem]'
              } ${status === 'paused' ? 'animate-pulse' : ''}`}
              style={{
                backgroundImage: 'linear-gradient(180deg, #ffffff 0%, #ffffff 55%, rgba(255,255,255,0.62) 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
                filter: `drop-shadow(0 2px 20px ${accentColor}40)`
              }}
            >
              {isCountdownMode && displayMode === 'countdown'
                ? formatTime(remainingSeconds)
                : formatTime(elapsedSeconds)}
            </div>
          </div>

          {/* Secondary line: goal / elapsed toggle */}
          {isCountdownMode ? (
            <button
              type="button"
              onClick={() => setDisplayMode(prev => prev === 'countdown' ? 'elapsed' : 'countdown')}
              disabled={status === 'idle'}
              className={`-mt-0.5 text-[11px] font-semibold tabular-nums px-3 py-0.5 rounded-full border transition-colors ${status === 'idle' ? 'tab:hidden' : ''} ${
                isRose ? 'border-[#ff2d75]/30 text-pink-200/80' : 'border-slate-700/80 text-slate-400'
              } ${status !== 'idle' ? 'hover:text-white cursor-pointer' : 'cursor-default'}`}
              title={status !== 'idle' ? 'Alternar entre tempo restante e decorrido' : undefined}
            >
              Meta {formatTime(targetSeconds)}
              {status !== 'idle' && (
                <span className="opacity-60"> · {displayMode === 'countdown' ? `${formatTime(elapsedSeconds)} feitos` : `${formatTime(remainingSeconds)} restantes`}</span>
              )}
            </button>
          ) : (
            <span className={`-mt-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] tab:hidden ${isRose ? 'text-pink-300/60' : 'text-slate-500'}`}>
              {elapsedSeconds >= 3600 ? 'hh : mm : ss' : 'min : seg'}
            </span>
          )}

          {/* Action buttons, centred under the timer */}
          <div className="flex items-center justify-center gap-3 w-full max-w-md mt-1">
            {status === 'idle' && (
              <button
                onClick={handleInitiateStart}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3.5 tab:py-3 rounded-2xl bg-gradient-to-r ${primaryGradient} ${
                  isRose ? 'text-white' : 'text-slate-950'
                } font-semibold text-[13px] uppercase tracking-[0.18em] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] shadow-lg ${primaryShadow} active:scale-[0.97] transition-all cursor-pointer`}
              >
                <Play className="w-4 h-4 fill-current" />
                {isCountdownMode ? `Iniciar · ${targetSeconds / 60} min` : 'Iniciar treino'}
              </button>
            )}

            {status === 'running' && (
              <button
                onClick={onPause}
                className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 tab:py-3 rounded-2xl font-semibold text-[13px] uppercase tracking-[0.18em] text-white active:scale-[0.97] transition-all cursor-pointer bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_0_1px_rgba(239,68,68,0.9),0_12px_28px_-10px_rgba(239,68,68,0.85)]"
              >
                <Pause className="w-4 h-4 fill-white text-white" />
                Pausar
              </button>
            )}

            {status === 'paused' && (
              <button
                onClick={onResume}
                className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 tab:py-3 rounded-2xl bg-gradient-to-r ${isRose ? primaryGradient : 'from-sky-400 to-cyan-500 hover:from-sky-300 hover:to-cyan-400'} ${
                  isRose ? 'text-white' : 'text-slate-950'
                } font-semibold text-[13px] uppercase tracking-[0.18em] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] shadow-lg ${primaryShadow} active:scale-[0.97] transition-all cursor-pointer`}
              >
                <Play className="w-4 h-4 fill-current" />
                Retomar
              </button>
            )}

            {(status === 'running' || status === 'paused') && (
              <button
                onClick={onStop}
                className="flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 tab:py-3 rounded-2xl font-semibold text-[13px] uppercase tracking-[0.18em] text-white active:scale-[0.97] transition-all cursor-pointer bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_0_1px_rgba(34,197,94,0.9),0_12px_28px_-10px_rgba(34,197,94,0.85)]"
              >
                <Square className="w-3.5 h-3.5 fill-white text-white" />
                Finalizar
              </button>
            )}

            {status === 'idle' && elapsedSeconds > 0 && (
              <button
                onClick={onReset}
                className={`flex items-center justify-center px-4 py-3.5 tab:py-3 rounded-2xl border active:scale-95 transition-all cursor-pointer ${
                  isRose
                    ? 'bg-[#380743] hover:bg-[#4d0a5e] border-[#ff2d75]/40 text-pink-200 hover:text-white'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border-slate-700/80'
                }`}
                title="Zerar cronómetro"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM: WIDE SPORT VELODROME TRACK & REALISTIC PEDALING CYCLIST */}
        {(status === 'running' || status === 'paused' || elapsedSeconds > 0) && (
          <div className="w-full pt-1 flex flex-col animate-fadeIn">
            {/* Premium goal track: vector cyclist pedalling at live cadence */}
            <div className="mt-1">
              <GoalTrack
                progress={progressExact}
                isRunning={status === 'running'}
                isPaused={status === 'paused'}
                cadence={cadence}
                isRose={isRose}
                customGif={customGif}
                startLabel="Start"
                endLabel={isCountdownMode ? `Meta ${formatTime(targetSeconds)}` : `Volta ${lapNumber}`}
              />
            </div>
          </div>
        )}

      </div>
    </>
  );
}
