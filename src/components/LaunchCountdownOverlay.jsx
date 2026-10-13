import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { playBeep } from '../utils/audio';

// Race-start countdown: three lights, huge numerals, motivational lines, then "VAI!"
const STEPS = {
  3: { color: '#f43f5e', line: (name) => (name ? `Prepara-te, ${name}` : 'Prepara-te'), sub: 'Mãos no guiador' },
  2: { color: '#f59e0b', line: () => 'Respira fundo', sub: 'Encontra o teu ritmo' },
  1: { color: '#facc15', line: () => 'Pernas prontas', sub: 'Está quase…' },
  GO: { color: '#22c55e', line: () => 'VAI!', sub: 'Dá tudo nos pedais' }
};

export default function LaunchCountdownOverlay({
  isOpen,
  onComplete,
  onSkip,
  riderName
}) {
  const [count, setCount] = useState(3);

  // The parent re-renders on every telemetry poll (HA mode polls twice a second while idle);
  // keep the latest callback in a ref so those re-renders don't restart the 3-2-1 timers.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!isOpen) {
      setCount(3);
      return;
    }

    playBeep(520, 0.2);
    const timers = [
      setTimeout(() => { setCount(2); playBeep(520, 0.2); }, 1000),
      setTimeout(() => { setCount(1); playBeep(520, 0.2); }, 2000),
      setTimeout(() => { setCount('GO'); playBeep(1040, 0.45); }, 3000),
      setTimeout(() => onCompleteRef.current?.(), 3900)
    ];
    return () => timers.forEach(clearTimeout);
  }, [isOpen]);

  if (!isOpen) return null;

  const step = STEPS[count];
  const isGo = count === 'GO';
  const lit = isGo ? 3 : 4 - count; // lights on: 3→1, 2→2, 1→3, GO→all green
  const R = 46;
  const C = 2 * Math.PI * R;

  // Portal to <body> so it sits above the navbar (the timer card lives in a lower stacking context)
  return createPortal(
    <div className="fixed inset-0 z-[950] flex flex-col items-center justify-center overflow-hidden select-none animate-[motivation-fade_0.25s_ease-out_both]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#03060c]/95 backdrop-blur-2xl" />
      <div
        className="absolute w-[80vmin] h-[80vmin] rounded-full blur-[120px] transition-colors duration-500 pointer-events-none"
        style={{ background: step.color, opacity: isGo ? 0.45 : 0.28 }}
      />
      {/* GO flash */}
      {isGo && <div className="absolute inset-0 bg-white animate-[countdown-flash_0.6s_ease-out_both] pointer-events-none" />}

      {/* Start lights */}
      <div
        className="relative flex items-center gap-4 px-6 py-3.5 rounded-full mb-[4vh]"
        style={{
          background: 'linear-gradient(180deg, #1b2333 0%, #0b1018 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -2px 0 rgba(0,0,0,0.6), 0 16px 40px -12px rgba(0,0,0,0.9)'
        }}
      >
        {[0, 1, 2].map((i) => {
          const on = i < lit;
          const c = isGo ? '#22c55e' : STEPS[3 - i].color;
          return (
            <span
              key={i}
              className="w-7 h-7 rounded-full transition-all duration-200"
              style={{
                background: on ? `radial-gradient(circle at 35% 30%, #fff 0%, ${c} 35%, ${c} 70%)` : 'radial-gradient(circle at 35% 30%, #334155, #0f172a)',
                boxShadow: on ? `0 0 18px ${c}, 0 0 40px ${c}88, inset 0 -2px 3px rgba(0,0,0,0.35)` : 'inset 0 2px 4px rgba(0,0,0,0.8)'
              }}
            />
          );
        })}
      </div>

      {/* Huge numeral with draining progress ring */}
      <div className="relative flex items-center justify-center" style={{ width: '46vmin', height: '46vmin' }}>
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" />
          {!isGo && (
            <circle
              key={count}
              cx="50" cy="50" r={R}
              fill="none"
              stroke={step.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={C}
              style={{
                filter: `drop-shadow(0 0 4px ${step.color})`,
                animation: 'countdown-ring 1s linear forwards',
                '--ring-c': C
              }}
            />
          )}
        </svg>

        <span
          key={count}
          className="relative font-black tabular-nums leading-none tracking-[-0.04em] animate-[countdown-pop_0.55s_cubic-bezier(0.2,1.4,0.4,1)_both]"
          style={{
            fontSize: isGo ? '19vmin' : '32vmin',
            color: '#fff',
            textShadow: `0 0 40px ${step.color}, 0 0 90px ${step.color}aa, 0 6px 0 rgba(0,0,0,0.35)`
          }}
        >
          {isGo ? 'VAI!' : count}
        </span>
      </div>

      {/* Motivational lines */}
      <div key={`line-${count}`} className="relative mt-[3vh] text-center animate-[countdown-line_0.45s_ease-out_both]">
        {!isGo && (
          <h2 className="text-[clamp(1.6rem,4.2vmin,2.6rem)] font-bold tracking-tight text-white">{step.line(riderName)}</h2>
        )}
        <p
          className="mt-1.5 text-[clamp(0.85rem,2vmin,1.1rem)] font-semibold uppercase tracking-[0.35em]"
          style={{ color: step.color }}
        >
          {step.sub}
        </p>
      </div>

      {/* Skip */}
      {!isGo && (
        <button
          onClick={onSkip}
          className="relative mt-[5vh] px-5 py-2.5 rounded-full text-[12px] font-semibold uppercase tracking-[0.2em] text-slate-400 hover:text-white bg-white/[0.05] ring-1 ring-white/10 transition-colors cursor-pointer"
        >
          Saltar contagem →
        </button>
      )}
    </div>,
    document.body
  );
}
