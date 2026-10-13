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
import { accentHairlineStyle } from '../constants/surfaces';
import GlassPanel from './GlassPanel';

// Glossy "liquid glass" pill: saturated colour body, crisp top rim, curved specular
// highlight on the upper half and a bounce-light reflection along the bottom edge.
function LiquidButton({ onClick, from, to, glow, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 tab:py-3 rounded-full overflow-hidden font-semibold text-[13px] uppercase tracking-[0.18em] text-white cursor-pointer transition-all duration-150 hover:brightness-110 active:scale-[0.97] active:brightness-95"
      style={{
        background: `linear-gradient(180deg, ${from} 0%, ${to} 100%)`,
        boxShadow: [
          'inset 0 1.5px 0 rgba(255,255,255,0.7)',
          'inset 0 -2px 3px rgba(255,255,255,0.35)',
          'inset 0 10px 16px -8px rgba(255,255,255,0.45)',
          'inset 0 -10px 18px -10px rgba(0,0,0,0.35)',
          'inset 0 0 0 1px rgba(255,255,255,0.18)',
          `0 2px 4px ${glow}55`,
          `0 14px 30px -10px ${glow}`
        ].join(', '),
        textShadow: '0 1px 2px rgba(0,0,0,0.35)'
      }}
    >
      {/* Curved specular highlight */}
      <span className="pointer-events-none absolute top-[2px] left-[6%] right-[6%] h-[48%] rounded-full bg-gradient-to-b from-white/55 via-white/15 to-transparent" />
      {/* Bounce light along the bottom */}
      <span className="pointer-events-none absolute bottom-[2px] left-[18%] right-[18%] h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent blur-[0.5px]" />
      <span className="relative flex items-center gap-2.5">{children}</span>
    </button>
  );
}

// Each duration has its own colour (cool → hot as the ride gets longer)
const COUNTDOWN_PRESETS = [
  { id: 'free', label: 'Livre', seconds: 0, tag: 'Sem limite', from: '#94a3b8', to: '#475569' },
  { id: '5m', label: '5 min', seconds: 300, tag: 'Sprint', from: '#3b82f6', to: '#1e40af' },
  { id: '10m', label: '10 min', seconds: 600, tag: 'Express', from: '#14b8a6', to: '#0f766e' },
  { id: '15m', label: '15 min', seconds: 900, tag: 'Cardio', from: '#22c55e', to: '#15803d' },
  { id: '20m', label: '20 min', seconds: 1200, tag: 'Queima', from: '#facc15', to: '#a16207' },
  { id: '30m', label: '30 min', seconds: 1800, tag: 'Endurance', from: '#f97316', to: '#c2410c' },
  { id: '45m', label: '45 min', seconds: 2700, tag: 'Pro Ride', from: '#ef4444', to: '#991b1b' },
  { id: '60m', label: '60 min', seconds: 3600, tag: 'Desafio', from: '#a855f7', to: '#6b21a8' }
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
  cadence = 0,
  onBeforeStart,
  riderName
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

  // Ask who is riding (if the parent wants to), then run the 3-2-1 launch
  const handleInitiateStart = () => {
    if (onBeforeStart) onBeforeStart(() => setShowLaunchOverlay(true));
    else setShowLaunchOverlay(true);
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
        riderName={riderName}
      />

      <GlassPanel
        isRose={isRose}
        accent={accentColor}
        accent2={isRose ? '#d946ef' : '#34d399'}
        radius={28}
        innerClassName="px-5 py-4 md:px-7 md:py-5 tab:py-3.5 flex flex-col gap-3.5 md:gap-4 tab:gap-2.5"
      >
        {/* Top accent hairline */}
        <div className="absolute top-0 inset-x-10 h-px pointer-events-none" style={accentHairlineStyle(accentColor)} />

        {/* Rider image picker (corner) */}
        {status !== 'idle' && (
          <div className="absolute top-3 right-8 z-10 flex items-center gap-1">
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
              className="grid grid-cols-4 md:grid-cols-8 gap-2 py-1"
            >
              {COUNTDOWN_PRESETS.map((preset) => {
                const isSelected = targetSeconds === preset.seconds;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectTargetSeconds && onSelectTargetSeconds(preset.seconds)}
                    className={`relative overflow-hidden flex flex-col items-center justify-center py-2 rounded-2xl text-white transition-all duration-200 cursor-pointer active:scale-95 ${
                      isSelected ? 'scale-[1.05] z-[1]' : 'hover:brightness-125'
                    }`}
                    style={isSelected ? {
                      // Selected: solid liquid-glass chip in its colour
                      background: `linear-gradient(180deg, ${preset.from} 0%, ${preset.to} 100%)`,
                      boxShadow: [
                        'inset 0 1.5px 0 rgba(255,255,255,0.7)',
                        'inset 0 -2px 3px rgba(255,255,255,0.3)',
                        'inset 0 8px 12px -6px rgba(255,255,255,0.4)',
                        '0 0 0 2px #ffffff',
                        `0 0 0 4px ${preset.from}66`,
                        `0 12px 26px -8px ${preset.from}`
                      ].join(', '),
                      textShadow: '0 1px 2px rgba(0,0,0,0.35)'
                    } : {
                      // Unselected: clearly coloured glass chip, a little darker than when selected
                      background: `linear-gradient(180deg, ${preset.from}c7 0%, ${preset.to}b3 100%)`,
                      boxShadow: [
                        'inset 0 1px 0 rgba(255,255,255,0.4)',
                        'inset 0 -1px 0 rgba(255,255,255,0.1)',
                        `inset 0 0 0 1px ${preset.from}`,
                        '0 6px 14px -8px rgba(0,0,0,0.8)'
                      ].join(', '),
                      textShadow: '0 1px 2px rgba(0,0,0,0.4)'
                    }}
                  >
                    {/* Curved specular highlight */}
                    <span
                      className="pointer-events-none absolute top-[2px] left-[8%] right-[8%] h-[46%] rounded-[14px] bg-gradient-to-b to-transparent"
                      style={{ backgroundImage: `linear-gradient(180deg, rgba(255,255,255,${isSelected ? 0.45 : 0.28}), transparent)` }}
                    />
                    <span className="relative text-[13px] font-semibold tabular-nums tracking-tight">{preset.label}</span>
                    <span
                      className="relative text-[9px] font-medium tracking-wide mt-0.5"
                      style={{ color: 'rgba(255,255,255,0.88)' }}
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
              <LiquidButton
                onClick={handleInitiateStart}
                from={isRose ? '#ff5c97' : '#34d399'}
                to={isRose ? '#a21caf' : '#047857'}
                glow={isRose ? '#ff2d75' : '#10b981'}
              >
                <Play className="w-4 h-4 fill-current" />
                {isCountdownMode ? `Iniciar · ${targetSeconds / 60} min` : 'Iniciar treino'}
              </LiquidButton>
            )}

            {status === 'running' && (
              <LiquidButton onClick={onPause} from="#f87171" to="#b91c1c" glow="#ef4444">
                <Pause className="w-4 h-4 fill-white text-white" />
                Pausar
              </LiquidButton>
            )}

            {status === 'paused' && (
              <LiquidButton
                onClick={onResume}
                from={isRose ? '#ff5c97' : '#38bdf8'}
                to={isRose ? '#a21caf' : '#0369a1'}
                glow={isRose ? '#ff2d75' : '#0ea5e9'}
              >
                <Play className="w-4 h-4 fill-current" />
                Retomar
              </LiquidButton>
            )}

            {(status === 'running' || status === 'paused') && (
              <LiquidButton onClick={onStop} from="#4ade80" to="#15803d" glow="#22c55e">
                <Square className="w-3.5 h-3.5 fill-white text-white" />
                Finalizar
              </LiquidButton>
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

      </GlassPanel>
    </>
  );
}
