import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer,
  Hourglass,
  CheckCircle2,
  ChevronRight,
  Flame,
  Zap,
  Clock,
  Flag,
  Trophy,
  Upload
} from 'lucide-react';
import LaunchCountdownOverlay from './LaunchCountdownOverlay';

const COUNTDOWN_PRESETS = [
  { id: 'free', label: 'Livre', seconds: 0, tag: 'Sem limite' },
  { id: '5m', label: '5 min', seconds: 300, tag: 'Sprint' },
  { id: '10m', label: '10 min', seconds: 600, tag: 'Express' },
  { id: '15m', label: '15 min', seconds: 900, tag: 'Cardio' },
  { id: '20m', label: '20 min', seconds: 1200, tag: 'Queima' },
  { id: '30m', label: '30 min', seconds: 1800, tag: 'Endurance' },
  { id: '45m', label: '45 min', seconds: 2700, tag: 'Pro Ride' },
  { id: '60m', label: '60 min', seconds: 3600, tag: 'Desafio' }
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
  themeConfig
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
  const progressPercent = isCountdownMode 
    ? Math.min(100, Math.round((elapsedSeconds / targetSeconds) * 100)) 
    : (elapsedSeconds > 0 ? Math.min(100, Math.round(((elapsedSeconds % 1800) / 1800) * 100)) : 0);

  // Clamped position for cyclist along the track (4% to 95%)
  const cyclistLeft = Math.min(95, Math.max(4, progressPercent));

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
        className="rounded-2xl md:rounded-3xl p-3.5 md:p-4.5 border flex flex-col gap-3.5 md:gap-4 relative overflow-hidden transition-all duration-500 backdrop-blur-2xl"
        style={{
          background: isRose 
            ? 'linear-gradient(135deg, rgba(64, 10, 78, 0.92) 0%, rgba(42, 6, 56, 0.96) 50%, rgba(26, 3, 38, 0.98) 100%)' 
            : 'rgba(15, 23, 42, 0.75)',
          borderColor: isRose ? 'rgba(255, 45, 117, 0.55)' : 'rgba(56, 189, 248, 0.2)',
          boxShadow: isRose 
            ? '0 20px 50px -10px rgba(0, 0, 0, 0.85), 0 0 45px -5px rgba(255, 45, 117, 0.35), 0 0 65px -10px rgba(148, 0, 211, 0.4), inset 0 1px 2px 0 rgba(255, 133, 179, 0.45)' 
            : '0 15px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px -5px rgba(56, 189, 248, 0.15)'
        }}
      >
        {/* Top luminous neon glow hairline for premium finish */}
        {isRose && (
          <>
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff2d75] to-transparent opacity-90 pointer-events-none" />
            <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[#ff2d75]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-[#9400D3]/25 blur-3xl pointer-events-none" />
          </>
        )}
        
        {/* TOP: PREDEFINED COUNTDOWN SELECTOR (Available when session is idle or reset) */}
        {status === 'idle' && (
          <div className={`w-full flex flex-col gap-2 pb-3 border-b ${isRose ? 'border-[#ff2d75]/30' : 'border-slate-800/80'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Hourglass className={`w-3.5 h-3.5 ${isRose ? 'text-[#ff2d75]' : 'text-slate-400'}`} />
                <span className={`text-[10px] md:text-[11px] font-black uppercase tracking-wider font-mono ${
                  isRose ? 'text-pink-100' : 'text-slate-300'
                }`}>
                  Opções de Countdown Predefinidas
                </span>
              </div>
              <span className={`text-[9px] md:text-[10px] font-mono px-2 py-0.2 rounded-full border ${
                isRose 
                  ? 'bg-[#ff2d75]/20 text-[#ff85b3] border-[#ff2d75]/40 shadow-sm' 
                  : 'text-slate-400 border-transparent'
              }`}>
                {targetSeconds === 0 ? 'Modo: Tempo Livre' : `Meta: ${targetSeconds / 60} min`}
              </span>
            </div>

            {/* Premium Preset Buttons Ribbon */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
              {COUNTDOWN_PRESETS.map((preset) => {
                const isSelected = targetSeconds === preset.seconds;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onSelectTargetSeconds && onSelectTargetSeconds(preset.seconds)}
                    className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? isRose 
                          ? 'bg-gradient-to-b from-[#ff2d75] to-[#9400D3] text-white border-[#ff85b3] shadow-[0_0_20px_rgba(255,45,117,0.5)] scale-[1.03]' 
                          : 'bg-slate-800/90 shadow-lg'
                        : isRose 
                          ? 'bg-[#3b0748]/75 hover:bg-[#520a65]/90 border-[#ff2d75]/30 text-pink-200 hover:text-white hover:border-[#ff2d75]/60 hover:shadow-[0_0_12px_rgba(255,45,117,0.25)]'
                          : 'bg-slate-900/60 hover:bg-slate-800/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                    style={isSelected && !isRose ? {
                      borderColor: accentColor,
                      boxShadow: `0 0 15px -3px ${accentColor}40`
                    } : {}}
                  >
                    <span 
                      className={`text-xs md:text-sm font-black font-mono tracking-tight ${
                        isSelected ? 'text-white' : ''
                      }`}
                    >
                      {preset.label}
                    </span>
                    <span 
                      className="text-[9px] font-mono tracking-wide mt-0.5"
                      style={{ 
                        color: isSelected 
                          ? '#ffffff' 
                          : isRose ? '#f472b6' : '#64748b' 
                      }}
                    >
                      {preset.tag}
                    </span>
                    {isSelected && (
                      <span 
                        className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                          isRose ? 'bg-white shadow-[0_0_8px_#ffffff]' : ''
                        }`}
                        style={!isRose ? { backgroundColor: accentColor } : {}}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MIDDLE: TIMER & CONTROLS ROW */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 w-full">
          
          {/* Main Time Display */}
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            <div 
              className={`w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                isRose 
                  ? 'bg-gradient-to-br from-[#ff2d75]/30 to-[#9400D3]/40 border border-[#ff2d75]/60 text-[#ff2d75] shadow-[0_0_25px_rgba(255,45,117,0.4)]' 
                  : ''
              }`}
              style={!isRose ? {
                backgroundColor: `${accentColor}18`,
                border: `1px solid ${accentColor}35`,
                color: accentColor
              } : {}}
            >
              {isCountdownMode ? (
                <Hourglass className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <Timer className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${isRose ? 'text-[#ff85b3]' : 'text-slate-400'}`}>
                  {isCountdownMode 
                    ? (displayMode === 'countdown' ? 'Tempo Restante' : 'Tempo Decorrido')
                    : 'Tempo Decorrido'
                  }
                </span>

                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${currentStatus.badgeColor}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dotColor}`} />
                  {currentStatus.label}
                </div>

                {status === 'running' && (
                  <div
                    className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isRose ? 'bg-[#ff2d75]/15 border-[#ff2d75]/40 text-pink-200' : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    }`}
                    title="Screen Wake Lock ativo: o ecrã não se apaga por inatividade durante o treino"
                  >
                    <span>💡</span>
                    <span>Ecrã Ativo</span>
                  </div>
                )}

                {isCountdownMode && status !== 'idle' && (
                  <button
                    onClick={() => setDisplayMode(prev => prev === 'countdown' ? 'elapsed' : 'countdown')}
                    className={`text-[10px] font-mono underline ml-1 cursor-pointer ${
                      isRose ? 'text-pink-300 hover:text-white' : 'text-slate-500 hover:text-slate-300'
                    }`}
                    title="Alternar entre tempo restante e decorrido"
                  >
                    {displayMode === 'countdown' ? '(Ver Decorrido)' : '(Ver Restante)'}
                  </button>
                )}
              </div>

              <div className={`text-3xl md:text-4xl font-black font-mono tracking-tight text-white flex items-baseline ${
                isRose ? 'drop-shadow-[0_0_25px_rgba(255,45,117,0.45)]' : ''
              }`}>
                {isCountdownMode && displayMode === 'countdown'
                  ? formatTime(remainingSeconds)
                  : formatTime(elapsedSeconds)
                }
                <span className={`text-xs font-semibold ml-2 font-sans uppercase ${
                  isRose ? 'text-pink-300/80' : 'text-slate-500'
                }`}>
                  {isCountdownMode ? (
                    <span className={`font-mono ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>
                      / {formatTime(targetSeconds)}
                    </span>
                  ) : (
                    elapsedSeconds >= 3600 ? 'hh:mm:ss' : 'mm:ss'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-end">
            {status === 'idle' && (
              <button
                onClick={handleInitiateStart}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${primaryGradient} ${
                  isRose ? 'text-white' : 'text-slate-950'
                } font-black text-xs md:text-sm tracking-wide shadow-lg ${primaryShadow} active:scale-95 transition-all cursor-pointer`}
              >
                <Play className="w-4 h-4 fill-current" />
                {isCountdownMode ? `INICIAR (${targetSeconds / 60} MIN)` : 'INICIAR TREINO'}
              </button>
            )}

            {status === 'running' && (
              <>
                <button
                  onClick={onPause}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs md:text-sm tracking-wide active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <Pause className="w-4 h-4 fill-current" />
                  PAUSAR
                </button>

                <button
                  onClick={onStop}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border font-bold text-xs md:text-sm tracking-wide active:scale-95 transition-all shadow-md cursor-pointer ${
                    isRose
                      ? 'bg-rose-500/25 hover:bg-rose-500/35 border-[#ff2d75]/50 text-white'
                      : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <Square className="w-4 h-4 fill-current" />
                  FINALIZAR
                </button>
              </>
            )}

            {status === 'paused' && (
              <>
                <button
                  onClick={onResume}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-gradient-to-r ${primaryGradient} ${
                    isRose ? 'text-white' : 'text-slate-950'
                  } font-black text-xs md:text-sm tracking-wide active:scale-95 transition-all shadow-md cursor-pointer`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  RETOMAR
                </button>

                <button
                  onClick={onStop}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border font-bold text-xs md:text-sm tracking-wide active:scale-95 transition-all shadow-md cursor-pointer ${
                    isRose
                      ? 'bg-rose-500/25 hover:bg-rose-500/35 border-[#ff2d75]/50 text-white'
                      : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <Square className="w-4 h-4 fill-current" />
                  FINALIZAR
                </button>
              </>
            )}

            {status === 'idle' && elapsedSeconds > 0 && (
              <button
                onClick={onReset}
                className={`flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl border active:scale-95 transition-all cursor-pointer ${
                  isRose
                    ? 'bg-[#380743] hover:bg-[#4d0a5e] border-[#ff2d75]/40 text-pink-200 hover:text-white shadow-sm'
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
        {(isCountdownMode || status === 'running' || status === 'paused' || elapsedSeconds > 0) && (
          <div className="w-full pt-2 flex flex-col gap-2.5 animate-fadeIn">
            {/* Header info above track */}
            <div className={`flex items-center justify-between text-xs font-mono ${isRose ? 'text-pink-200' : 'text-slate-300'}`}>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-xl flex items-center justify-center border shadow-sm ${
                  isRose ? 'bg-[#ff2d75]/25 border-[#ff2d75]/50 text-[#ff85b3]' : 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                }`}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold">
                  {isCountdownMode ? 'Progresso da Meta:' : 'Ciclo de Treino:'}{' '}
                  <strong className={`text-sm ${isRose ? 'text-[#ff2d75]' : 'text-sky-400'}`}>{progressPercent}%</strong>
                </span>

                {/* GIF Selector / Upload Controls */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/gif,image/png,image/webp" 
                  className="hidden" 
                  onChange={handleGifUpload} 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Carregar ou alterar ficheiro GIF do ciclista"
                  className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 transition-all pointer-events-auto ${
                    isRose
                      ? 'bg-[#3b0748]/80 hover:bg-[#ff2d75]/30 border-[#ff2d75]/40 text-pink-200 hover:text-white'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <Upload className="w-2.5 h-2.5" />
                  <span>{customGif ? 'GIF Personalizado' : 'Trocar GIF'}</span>
                </button>
                {customGif && (
                  <button
                    type="button"
                    onClick={handleResetGif}
                    title="Repor GIF padrão"
                    className="text-[10px] text-pink-400 hover:text-pink-200 underline pointer-events-auto"
                  >
                    Repor
                  </button>
                )}
              </div>
              <span className={`font-semibold px-3 py-1 rounded-full border shadow-sm ${
                isRose 
                  ? 'bg-[#380743] border-[#ff2d75]/40 text-[#ff85b3]' 
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}>
                {isCountdownMode 
                  ? `${formatTime(elapsedSeconds)} / ${formatTime(targetSeconds)}`
                  : `${formatTime(elapsedSeconds)} decorridos`
                }
              </span>
            </div>

            {/* Wide Sport Velodrome Track (Height ~44-48px) */}
            <div className={`w-full h-11 sm:h-12 rounded-xl border-2 relative overflow-visible p-[2px] backdrop-blur-md shadow-2xl transition-all ${
              isRose 
                ? 'bg-[#22032b]/95 border-[#ff2d75]/55 shadow-[inset_0_3px_12px_rgba(0,0,0,0.9),0_0_30px_rgba(255,45,117,0.3)]' 
                : 'bg-slate-950/95 border-sky-500/45 shadow-[inset_0_3px_12px_rgba(0,0,0,0.9),0_0_25px_rgba(56,189,248,0.25)]'
            }`}>
              {/* Internal Track Fill (Illuminated Racing Beam) */}
              <div 
                className="h-full rounded-lg transition-all duration-500 relative overflow-hidden"
                style={{
                  width: `${progressPercent}%`,
                  background: isRose 
                    ? 'linear-gradient(90deg, rgba(148,0,211,0.85) 0%, rgba(217,70,239,0.95) 55%, rgba(255,45,117,1) 100%)' 
                    : 'linear-gradient(90deg, rgba(2,132,199,0.85) 0%, rgba(56,189,248,1) 100%)',
                  boxShadow: isRose 
                    ? '0 0 30px rgba(255, 45, 117, 0.9), inset 0 1px 2px rgba(255,255,255,0.45)' 
                    : '0 0 25px rgba(56, 189, 248, 0.8), inset 0 1px 2px rgba(255,255,255,0.45)'
                }}
              >
                {/* Luminous speed streaks on active beam */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.18)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.18)_75%,transparent_75%)] bg-[length:20px_20px] opacity-40" />
              </div>

              {/* Velodrome Center Lane Dashed Line */}
              <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 h-[1px] border-b border-dashed border-white/20 pointer-events-none" />

              {/* Checkpoint Milestones (25%, 50%, 75%) */}
              <div className="absolute inset-0 pointer-events-none flex items-center">
                <span className="absolute left-[25%] top-0 bottom-0 w-[1px] bg-white/25 flex flex-col justify-end pb-1">
                  <span className="text-[8px] font-mono font-bold text-white/50 -translate-x-1/2">25%</span>
                </span>
                <span className="absolute left-[50%] top-0 bottom-0 w-[1px] bg-white/25 flex flex-col justify-end pb-1">
                  <span className="text-[8px] font-mono font-bold text-white/50 -translate-x-1/2">50%</span>
                </span>
                <span className="absolute left-[75%] top-0 bottom-0 w-[1px] bg-white/25 flex flex-col justify-end pb-1">
                  <span className="text-[8px] font-mono font-bold text-white/50 -translate-x-1/2">75%</span>
                </span>
              </div>

              {/* Start Line Marker */}
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono font-black tracking-widest text-white/50 uppercase">
                  START
                </span>
              </div>

              {/* Finish Line Marker (META) with Gold Trophy */}
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 flex items-center gap-1.5 font-mono font-black text-xs text-white">
                <Trophy className="w-4 h-4 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
                <span className="tracking-wider text-amber-200 hidden sm:inline font-sans">META</span>
              </div>

              {/* REALISTIC HIGH-PERFORMANCE CYCLIST (ANIMATED GIF - TRANSPARENT BACKGROUND & SIZED TO TRACK) */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 z-20 pointer-events-none transition-all duration-300 ease-out flex flex-col items-center"
                style={{
                  left: `${cyclistLeft}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Floating percentage badge above cyclist */}
                <div className={`-mt-6 mb-0.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-black border shadow-lg flex items-center gap-0.5 whitespace-nowrap ${
                  isRose
                    ? 'bg-[#ff2d75] text-white border-pink-200/80 shadow-[0_0_15px_rgba(255,45,117,0.9)]'
                    : 'bg-sky-400 text-slate-950 border-sky-100 shadow-[0_0_12px_rgba(56,189,248,0.8)]'
                }`}>
                  <span>{progressPercent}%</span>
                </div>

                {/* Cyclist GIF - Background blended/removed, calibrated to fit progress bar */}
                <div className="relative flex items-center justify-center">
                  <img 
                    src={customGif || "/cyclist.gif"} 
                    alt="Ciclista a pedalar" 
                    className={`h-9 sm:h-10 w-auto max-w-[70px] object-contain select-none pointer-events-none filter ${
                      isRose 
                        ? 'drop-shadow-[0_0_12px_rgba(255,45,117,0.85)]' 
                        : 'drop-shadow-[0_0_10px_rgba(56,189,248,0.85)]'
                    } ${status === 'paused' ? 'opacity-80 grayscale-[0.3]' : ''}`}
                    style={{
                      // Screen blend removes any black or dark background, native alpha renders transparently
                      mixBlendMode: 'screen',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
