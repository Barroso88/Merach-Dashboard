import React, { useId, useMemo } from 'react';

/**
 * Precision instrument gauge (speedometer / tachometer).
 * Matte dial, hairline ticks, a single live value arc with a glowing tip,
 * a slim needle and an optional session-peak marker.
 */

const START_ANGLE = -130;
const END_ANGLE = 130;
const TOTAL_SWEEP = END_ANGLE - START_ANGLE;

function polar(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx, cy, r, fromDeg, toDeg) {
  const a = polar(cx, cy, r, fromDeg);
  const b = polar(cx, cy, r, toDeg);
  const largeArc = toDeg - fromDeg > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${r} ${r} 0 ${largeArc} 1 ${b.x} ${b.y}`;
}

export default function SportNeedleGauge({
  value = 0,
  min = 0,
  max = 60,
  unit = 'km/h',
  title = 'VELOCIDADE',
  zones = [],
  majorTickInterval = 10,
  minorTickCount = 3,
  size = 290,
  accentColor = '#38bdf8',
  peak = 0,
  themeConfig
}) {
  const uid = useId().replace(/:/g, '');
  const isRose = themeConfig?.id === 'rose';

  const c = size / 2;
  const arcR = size / 2 - 20;
  const zoneR = arcR + 9;
  const tickOuter = arcR - 10;
  const labelR = arcR - 31;
  const needleLen = arcR - 13;

  const toRatio = (v) => (Math.min(max, Math.max(min, v)) - min) / (max - min);
  const toAngle = (v) => START_ANGLE + toRatio(v) * TOTAL_SWEEP;

  const ratio = toRatio(value);
  const needleAngle = toAngle(value);
  const isRedline = ratio > 0.86;
  const liveColor = isRedline ? '#f43f5e' : accentColor;

  const ticks = useMemo(() => {
    const list = [];
    const steps = Math.round((max - min) / majorTickInterval);
    for (let i = 0; i <= steps; i++) {
      const val = min + i * majorTickInterval;
      const angle = START_ANGLE + ((val - min) / (max - min)) * TOTAL_SWEEP;
      const p1 = polar(c, c, tickOuter, angle);
      const p2 = polar(c, c, tickOuter - 9, angle);
      const lp = polar(c, c, labelR, angle);
      list.push({ key: `M${i}`, val, major: true, p1, p2, lp });

      if (i < steps) {
        for (let j = 1; j <= minorTickCount; j++) {
          const mv = val + (j * majorTickInterval) / (minorTickCount + 1);
          const ma = START_ANGLE + ((mv - min) / (max - min)) * TOTAL_SWEEP;
          list.push({
            key: `m${i}-${j}`,
            val: mv,
            major: false,
            p1: polar(c, c, tickOuter, ma),
            p2: polar(c, c, tickOuter - 4, ma)
          });
        }
      }
    }
    return list;
  }, [min, max, majorTickInterval, minorTickCount, c, tickOuter, labelR]);

  const tip = polar(c, c, arcR, needleAngle);
  const showPeak = peak > min && peak > value + (max - min) * 0.01;
  const peakAngle = toAngle(peak);
  const peakA = polar(c, c, arcR - 6, peakAngle);
  const peakB = polar(c, c, arcR + 6, peakAngle);

  const faceStops = isRose
    ? ['#22072b', '#15041b', '#0b0210']
    : ['#111827', '#0a0f19', '#05080e'];
  const labelColor = isRose ? 'text-pink-200/55' : 'text-slate-400';
  const formattedValue = typeof value === 'number' ? value.toFixed(1) : value;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {title && (
        <div className="mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor, boxShadow: `0 0 8px ${accentColor}` }} />
          <span className={`text-[11px] font-semibold uppercase tracking-[0.3em] ${labelColor}`}>{title}</span>
        </div>
      )}

      <div
        className="relative rounded-full"
        style={{
          width: size,
          height: size,
          boxShadow: `0 24px 48px -24px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.04), 0 0 60px -30px ${liveColor}`
        }}
      >
        <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <defs>
            <radialGradient id={`face-${uid}`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor={faceStops[0]} />
              <stop offset="70%" stopColor={faceStops[1]} />
              <stop offset="100%" stopColor={faceStops[2]} />
            </radialGradient>
            <linearGradient id={`ring-${uid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0.06)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.14)" />
            </linearGradient>
            <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dial face + machined bezel hairline */}
          <circle cx={c} cy={c} r={size / 2 - 1} fill={`url(#face-${uid})`} />
          <circle cx={c} cy={c} r={size / 2 - 1.5} fill="none" stroke={`url(#ring-${uid})`} strokeWidth="1.5" />
          <circle cx={c} cy={c} r={size / 2 - 7} fill="none" stroke="rgba(0,0,0,0.55)" strokeWidth="4" />

          {/* Zone hints (thin, outside the main track) */}
          {zones.map((z, i) => (
            <path
              key={i}
              d={arcPath(c, c, zoneR, toAngle(z.from), toAngle(z.to))}
              fill="none"
              stroke={z.color}
              strokeWidth="2"
              opacity={ratio >= toRatio(z.from) ? 0.75 : 0.22}
              style={{ transition: 'opacity 0.4s' }}
            />
          ))}

          {/* Track */}
          <path
            d={arcPath(c, c, arcR, START_ANGLE, END_ANGLE)}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Live value arc + glowing tip */}
          {ratio > 0.004 && (
            <>
              <path
                d={arcPath(c, c, arcR, START_ANGLE, needleAngle)}
                fill="none"
                stroke={liveColor}
                strokeWidth="6"
                strokeLinecap="round"
                filter={`url(#glow-${uid})`}
                style={{ transition: 'stroke 0.3s' }}
              />
              <circle cx={tip.x} cy={tip.y} r="4.5" fill={liveColor} filter={`url(#glow-${uid})`} />
              <circle cx={tip.x} cy={tip.y} r="1.8" fill="#ffffff" />
            </>
          )}

          {/* Session peak marker */}
          {showPeak && (
            <line x1={peakA.x} y1={peakA.y} x2={peakB.x} y2={peakB.y} stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
          )}

          {/* Ticks + numerals */}
          {ticks.map((t) => {
            const passed = t.val <= value;
            return (
              <g key={t.key}>
                <line
                  x1={t.p1.x} y1={t.p1.y} x2={t.p2.x} y2={t.p2.y}
                  stroke={passed ? 'rgba(255,255,255,0.9)' : t.major ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.16)'}
                  strokeWidth={t.major ? 1.6 : 1}
                  strokeLinecap="round"
                />
                {t.major && (
                  <text
                    x={t.lp.x}
                    y={t.lp.y}
                    fill={passed ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.4)'}
                    fontSize={size > 260 ? 12 : 10}
                    fontWeight="600"
                    fontFamily="system-ui, -apple-system, 'SF Pro Text', sans-serif"
                    textAnchor="middle"
                    dominantBaseline="central"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {t.val}
                  </text>
                )}
              </g>
            );
          })}

          {/* Needle */}
          <g
            style={{
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: `${c}px ${c}px`,
              transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            <polygon
              points={`${c - 2.2},${c} ${c + 2.2},${c} ${c + 0.6},${c - needleLen} ${c - 0.6},${c - needleLen}`}
              fill="#f8fafc"
            />
            <polygon
              points={`${c - 0.9},${c - needleLen * 0.62} ${c + 0.9},${c - needleLen * 0.62} ${c + 0.6},${c - needleLen} ${c - 0.6},${c - needleLen}`}
              fill={liveColor}
            />
            <rect x={c - 1.6} y={c} width="3.2" height="16" rx="1.6" fill="rgba(255,255,255,0.25)" />
          </g>

          {/* Hub */}
          <circle cx={c} cy={c} r="11" fill="#0b1018" stroke="rgba(255,255,255,0.16)" strokeWidth="1.2" />
          <circle cx={c} cy={c} r="3.5" fill={liveColor} />
        </svg>

        {/* Digital readout */}
        <div className="absolute inset-x-0 flex flex-col items-center pointer-events-none" style={{ top: c + size * 0.13 }}>
          <span
            className="font-bold tabular-nums tracking-tight leading-none text-white"
            style={{ fontSize: Math.round(size * 0.165), textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}
          >
            {formattedValue}
          </span>
          <span
            className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.28em]"
            style={{ color: liveColor }}
          >
            {unit}
          </span>
        </div>

        {isRedline && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-rose-300"
            style={{ top: size * 0.27 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            Limite
          </div>
        )}
      </div>
    </div>
  );
}
