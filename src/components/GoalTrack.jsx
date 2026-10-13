import React from 'react';
import { Trophy } from 'lucide-react';
import RoadCyclist from './RoadCyclist';

const MILESTONES = [25, 50, 75];

// Fine fractal noise used as asphalt grain
const ASPHALT_NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.15' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.9 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function GoalTrack({
  progress = 0,            // 0–100, fractional
  isRunning = false,
  isPaused = false,
  cadence = 0,
  isRose = false,
  customGif = null,
  startLabel = 'START',
  endLabel = 'META'
}) {
  const accent = isRose ? '#ff2d75' : '#38bdf8';
  const glow = isRose ? 'rgba(255,45,117,0.75)' : 'rgba(56,189,248,0.7)';
  const isComplete = progress >= 100;

  const pct = Math.min(100, Math.max(0, progress));
  // The rider sits on the fill's leading edge; keep the sprite fully inside the track
  const riderLeft = `clamp(44px, ${pct}%, calc(100% - 56px))`;

  return (
    <div className="w-full select-none">
      {/* Track area: rider rides on the road */}
      <div className="relative h-[66px]">
        {/* Road (side view): asphalt, painted edge lines, centre dashes */}
        <div
          className="absolute left-0 right-0 bottom-[6px] h-[28px] rounded-[6px] overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, #2a2e35 0%, #353a42 30%, #2c3037 70%, #22252b 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 16px -8px rgba(0,0,0,0.95), 0 0 0 1px rgba(0,0,0,0.6)'
          }}
        >
          {/* Asphalt grain */}
          <div className="absolute inset-0 opacity-[0.45] mix-blend-overlay" style={{ backgroundImage: ASPHALT_NOISE, backgroundSize: '120px 120px' }} />

          {/* Travelled section: lit asphalt */}
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-1000 ease-linear overflow-hidden"
            style={{
              width: `${pct}%`,
              background: isComplete
                ? 'linear-gradient(90deg, rgba(251,191,36,0.05), rgba(251,191,36,0.24))'
                : `linear-gradient(90deg, ${accent}08 0%, ${accent}2e 100%)`
            }}
          >
            {isRunning && (
              <div
                className="absolute inset-y-0 w-1/3 animate-[goal-shimmer_2.8s_linear_infinite]"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)' }}
              />
            )}
          </div>

          {/* Painted edge lines */}
          <div className="absolute inset-x-0 top-[3px] h-px bg-white/70" />
          <div className="absolute inset-x-0 bottom-[5px] h-[2px] bg-white/85" />
          {/* Concrete kerb */}
          <div
            className="absolute inset-x-0 bottom-0 h-[3px]"
            style={{ background: 'repeating-linear-gradient(90deg, #8b929c 0 18px, #737a84 18px 19px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)' }}
          />
          {/* Edge lines light up along the travelled section */}
          {[['top-[3px]', 'h-px'], ['bottom-[5px]', 'h-[2px]']].map(([pos, hgt]) => (
            <div
              key={pos}
              className={`absolute left-0 ${pos} ${hgt} transition-[width] duration-1000 ease-linear`}
              style={{
                width: `${pct}%`,
                background: isComplete ? '#fbbf24' : accent,
                boxShadow: `0 0 6px ${isComplete ? 'rgba(251,191,36,0.9)' : glow}`
              }}
            />
          ))}

          {/* Centre dashed line */}
          <div
            className="absolute inset-x-0 top-[12px] h-[1.5px] opacity-80"
            style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f8fafc 0 12px, transparent 12px 26px)' }}
          />

          {/* Start line */}
          <div className="absolute left-[10px] top-[3px] bottom-[5px] w-[3px] bg-white/85" />

          {/* Finish line painted across the road */}
          <div
            className="absolute right-[6px] top-0 bottom-[3px] w-[12px]"
            style={{
              background: 'repeating-conic-gradient(#f8fafc 0 25%, #111827 0 50%) 0 0 / 6px 6px',
              boxShadow: isComplete ? '0 0 14px rgba(251,191,36,0.9)' : 'none'
            }}
          />
        </div>

        {/* Roadside marker posts at 25 / 50 / 75 % */}
        {MILESTONES.map((m) => {
          const passed = pct >= m;
          return (
            <span key={m} className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center z-[1]" style={{ left: `${m}%` }}>
              <span
                className="block w-[4px] h-[3px] rounded-[1px] transition-all duration-500"
                style={{ background: passed ? accent : '#64748b', boxShadow: passed ? `0 0 6px ${accent}` : 'none' }}
              />
              <span className="block w-[2px] h-[5px] bg-slate-300/80" />
            </span>
          );
        })}

        {/* Rider */}
        <div
          className="absolute bottom-[11px] z-[3] -translate-x-1/2 transition-[left] duration-1000 ease-linear"
          style={{ left: riderLeft }}
        >
          {/* Speed streaks while pedalling */}
          {isRunning && cadence > 0 && (
            <div className="absolute right-[88%] top-[18px] flex flex-col gap-[5px] items-end pointer-events-none">
              {[18, 12, 15].map((w, i) => (
                <span
                  key={i}
                  className="block h-px rounded-full animate-[goal-streak_0.7s_linear_infinite]"
                  style={{ width: w, background: accent, animationDelay: `${i * 0.18}s` }}
                />
              ))}
            </div>
          )}

          {/* Percentage chip */}
          <div
            className="absolute -top-[17px] left-1/2 -translate-x-1/2 px-1.5 py-[1px] rounded-full text-[9px] leading-[13px] font-bold tabular-nums whitespace-nowrap border"
            style={{
              background: isComplete ? '#fbbf24' : accent,
              color: isRose ? '#fff' : '#020617',
              borderColor: 'rgba(255,255,255,0.6)',
              boxShadow: `0 0 10px ${isComplete ? 'rgba(251,191,36,0.8)' : glow}`
            }}
          >
            {Math.floor(pct)}%
          </div>

          <div className={`transition-opacity ${isPaused ? 'opacity-60 grayscale-[0.4]' : ''}`}>
            {customGif ? (
              <img
                src={customGif}
                alt="Ciclista"
                className="h-10 w-auto max-w-[70px] object-contain"
                style={{ mixBlendMode: 'screen', filter: `drop-shadow(0 0 6px ${glow})` }}
              />
            ) : (
              <RoadCyclist
                color={accent}
                glow={glow}
                cadence={cadence || (isRunning ? 80 : 0)}
                isMoving={isRunning}
              />
            )}
          </div>
        </div>
      </div>

      {/* Labels under the road */}
      <div className="relative h-[14px] mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] tabular-nums text-slate-500">
        <span className="absolute left-0 flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          {startLabel}
        </span>
        {MILESTONES.map((m) => (
          <span
            key={m}
            className="absolute -translate-x-1/2 transition-colors"
            style={{ left: `${m}%`, color: pct >= m ? '#cbd5e1' : undefined }}
          >
            {m}%
          </span>
        ))}
        <span className={`absolute right-0 flex items-center gap-1 ${isComplete ? 'text-amber-300' : 'text-amber-200/80'}`}>
          <Trophy className={`w-3 h-3 ${isComplete ? 'drop-shadow-[0_0_6px_rgba(251,191,36,0.9)]' : ''}`} />
          {endLabel}
        </span>
      </div>
    </div>
  );
}
