import React, { useEffect, useState } from 'react';
import { Zap, Flag } from 'lucide-react';
import { playBeep } from '../utils/audio';

export default function LaunchCountdownOverlay({
  isOpen,
  onComplete,
  onSkip,
  themeConfig
}) {
  const [count, setCount] = useState(3);
  const accentColor = themeConfig?.speedAccent || '#38bdf8';

  useEffect(() => {
    if (!isOpen) {
      setCount(3);
      return;
    }

    // Sound on initial count 3
    playBeep(520, 0.2);

    const timer1 = setTimeout(() => {
      setCount(2);
      playBeep(520, 0.2);
    }, 1000);

    const timer2 = setTimeout(() => {
      setCount(1);
      playBeep(520, 0.2);
    }, 2000);

    const timer3 = setTimeout(() => {
      setCount('GO');
      playBeep(1040, 0.4); // High pitch for launch
    }, 3000);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 3700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-2xl animate-fadeIn select-none">
      {/* Background radial energy flare */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none opacity-40 transition-all duration-300"
        style={{
          background: count === 'GO' ? '#10b981' : accentColor
        }}
      />

      {/* Starting Lights (Launch Bar) */}
      <div className="relative z-10 flex items-center gap-4 mb-8 bg-slate-900/90 border border-slate-700/80 px-6 py-3 rounded-full shadow-2xl">
        <div className={`w-5 h-5 rounded-full transition-all duration-300 ${
          count === 3 || count === 2 || count === 1 || count === 'GO' 
            ? 'bg-rose-500 shadow-[0_0_15px_#f43f5e]' 
            : 'bg-slate-800'
        }`} />
        <div className={`w-5 h-5 rounded-full transition-all duration-300 ${
          count === 2 || count === 1 || count === 'GO' 
            ? 'bg-amber-400 shadow-[0_0_15px_#fbbf24]' 
            : 'bg-slate-800'
        }`} />
        <div className={`w-5 h-5 rounded-full transition-all duration-300 ${
          count === 1 || count === 'GO' 
            ? 'bg-sky-400 shadow-[0_0_15px_#38bdf8]' 
            : 'bg-slate-800'
        }`} />
        <div className={`w-5 h-5 rounded-full transition-all duration-300 ${
          count === 'GO' 
            ? 'bg-emerald-400 shadow-[0_0_20px_#10b981] animate-ping' 
            : 'bg-slate-800'
        }`} />
      </div>

      {/* Main Countdown Typography & Animation */}
      <div className="relative z-10 flex flex-col items-center">
        {count === 'GO' ? (
          <div className="flex flex-col items-center animate-bounce">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 mb-4 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
              <Zap className="w-12 h-12 fill-current" />
            </div>
            <h1 className="text-6xl md:text-8xl font-black font-mono tracking-wider text-emerald-400 drop-shadow-[0_0_30px_rgba(16,185,129,0.8)]">
              LARGADA!
            </h1>
            <p className="text-sm font-mono tracking-widest text-emerald-300/80 uppercase mt-2">
              Força nos pedais
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div 
              key={count} 
              className="text-8xl md:text-9xl font-black font-mono tracking-tight text-white animate-scaleIn transition-all"
              style={{
                textShadow: `0 0 50px ${accentColor}`
              }}
            >
              {count}
            </div>
            <p className="text-xs font-mono font-bold tracking-[0.3em] uppercase text-slate-400 mt-2">
              A PREPARAR TELEMETRIA...
            </p>
          </div>
        )}
      </div>

      {/* Skip button at bottom */}
      <div className="relative z-10 mt-12">
        <button
          onClick={onSkip}
          className="px-5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer"
        >
          Saltar Contagem &rarr;
        </button>
      </div>
    </div>
  );
}
