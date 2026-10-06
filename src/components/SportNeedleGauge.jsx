import React, { useMemo } from 'react';

/**
 * High-End Motorsport Instrument Gauge (Speedometer & Tachometer)
 * Featuring seamless integrated in-dial typography, laser pointer and racing bezel.
 */
export default function SportNeedleGauge({
  value = 0,
  min = 0,
  max = 60,
  unit = 'km/h',
  title = 'VELOCIDADE',
  zones = [
    { from: 0, to: 18, color: '#64748b' },
    { from: 18, to: 30, color: '#38bdf8' },
    { from: 30, to: 42, color: '#10b981' },
    { from: 42, to: 52, color: '#fbbf24' },
    { from: 52, to: 60, color: '#f43f5e' }
  ],
  majorTickInterval = 10,
  minorTickCount = 3,
  size = 290,
  accentColor = '#38bdf8',
  themeConfig
}) {
  // Angle sweep: -130deg to +130deg (260 degrees total sweep)
  const START_ANGLE = -130;
  const END_ANGLE = 130;
  const TOTAL_SWEEP = END_ANGLE - START_ANGLE;

  // Clamped needle angle calculation
  const clampedValue = Math.min(max, Math.max(min, value));
  const ratio = (clampedValue - min) / (max - min);
  const needleAngle = START_ANGLE + (ratio * TOTAL_SWEEP);

  // Radius geometry
  const center = size / 2;
  const outerRadius = (size / 2) - 12;
  const tickRadius = outerRadius - 16;
  const labelRadius = tickRadius - 18;

  // Generate tick markers and numbers
  const ticks = useMemo(() => {
    const list = [];
    const totalSteps = Math.round((max - min) / majorTickInterval);

    for (let i = 0; i <= totalSteps; i++) {
      const val = min + i * majorTickInterval;
      const tickRatio = (val - min) / (max - min);
      const angle = START_ANGLE + (tickRatio * TOTAL_SWEEP);
      const rad = ((angle - 90) * Math.PI) / 180;

      // Major tick coordinates
      const x1 = center + tickRadius * Math.cos(rad);
      const y1 = center + tickRadius * Math.sin(rad);
      const x2 = center + (tickRadius - 12) * Math.cos(rad);
      const y2 = center + (tickRadius - 12) * Math.sin(rad);

      // Label coordinate
      const lx = center + labelRadius * Math.cos(rad);
      const ly = center + labelRadius * Math.sin(rad);

      const zone = zones.find(z => val >= z.from && val <= z.to) || zones[zones.length - 1];

      list.push({
        val,
        x1, y1, x2, y2,
        lx, ly,
        isMajor: true,
        color: zone ? zone.color : '#64748b'
      });

      // Minor ticks
      if (i < totalSteps) {
        for (let j = 1; j <= minorTickCount; j++) {
          const minorVal = val + (j * (majorTickInterval / (minorTickCount + 1)));
          const minorRatio = (minorVal - min) / (max - min);
          const minorAngle = START_ANGLE + (minorRatio * TOTAL_SWEEP);
          const mrad = ((minorAngle - 90) * Math.PI) / 180;

          const mx1 = center + tickRadius * Math.cos(mrad);
          const my1 = center + tickRadius * Math.sin(mrad);
          const mx2 = center + (tickRadius - 6) * Math.cos(mrad);
          const my2 = center + (tickRadius - 6) * Math.sin(mrad);

          list.push({
            val: minorVal,
            x1: mx1, y1: my1, x2: mx2, y2: my2,
            isMajor: false,
            color: '#334155'
          });
        }
      }
    }
    return list;
  }, [min, max, majorTickInterval, minorTickCount, size]);

  const isRedline = ratio > 0.86;

  // Outer bezel micro-graduation notches (luxury motorsport chronograph aesthetic)
  const outerPips = useMemo(() => {
    const list = [];
    const pipCount = 48;
    for (let i = 0; i < pipCount; i++) {
      const angle = (i * 360) / pipCount;
      const rad = ((angle - 90) * Math.PI) / 180;
      const isMajor = i % 4 === 0;
      const r1 = outerRadius + 4;
      const r2 = isMajor ? outerRadius : outerRadius + 2;

      list.push({
        x1: center + r1 * Math.cos(rad),
        y1: center + r1 * Math.sin(rad),
        x2: center + r2 * Math.cos(rad),
        y2: center + r2 * Math.sin(rad),
        isMajor
      });
    }
    return list;
  }, [center, outerRadius]);

  // Dynamic active glowing progress arc following the needle in real-time
  const activeArcPath = useMemo(() => {
    if (ratio <= 0.005) return null;
    const startRad = ((START_ANGLE - 90) * Math.PI) / 180;
    const currentRad = ((needleAngle - 90) * Math.PI) / 180;
    const arcR = outerRadius - 4;

    const x1 = center + arcR * Math.cos(startRad);
    const y1 = center + arcR * Math.sin(startRad);
    const x2 = center + arcR * Math.cos(currentRad);
    const y2 = center + arcR * Math.sin(currentRad);

    const largeArc = (needleAngle - START_ANGLE) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${arcR} ${arcR} 0 ${largeArc} 1 ${x2} ${y2}`;
  }, [ratio, needleAngle, center, outerRadius]);

  // Format the display value strictly with 1 decimal place without rounding
  const formattedValue = typeof value === 'number' 
    ? value.toFixed(1) 
    : value;

  const isRose = themeConfig?.id === 'rose';
  const bezelConic = isRedline
    ? 'conic-gradient(from 210deg at 50% 50%, #64748b 0deg, #f43f5e 60deg, #1e293b 120deg, #64748b 180deg, #f43f5e 240deg, #1e293b 300deg, #64748b 360deg)'
    : (themeConfig?.gaugeBezelConic || `conic-gradient(from 210deg at 50% 50%, #475569 0deg, ${accentColor} 45deg, #1e293b 90deg, #64748b 150deg, #1e293b 210deg, ${accentColor} 270deg, #334155 330deg, #475569 360deg)`);
  const innerRingBg = themeConfig?.gaugeInnerRing || 'linear-gradient(145deg, #1e293b 0%, #090e17 50%, #030712 100%)';
  const dialFaceBg = themeConfig?.gaugeDialBg || 'radial-gradient(circle at 50% 50%, #151e2d 0%, #0c121d 65%, #05080e 100%)';
  const meshColor = themeConfig?.gaugeMeshColor || 'rgba(255,255,255,0.035)';

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* Title Header with Motorsport Glow Style placed ABOVE the gauge */}
      {title && (
        <div className="mb-4 flex items-center justify-center">
          <div 
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all duration-300 backdrop-blur-md"
            style={{
              background: isRose
                ? 'linear-gradient(180deg, rgba(38, 10, 30, 0.9) 0%, rgba(20, 5, 18, 0.95) 100%)'
                : 'linear-gradient(180deg, rgba(15, 23, 42, 0.85) 0%, rgba(8, 12, 20, 0.95) 100%)',
              borderColor: `${accentColor}40`,
              boxShadow: `0 0 20px -3px ${accentColor}30, inset 0 1px 0 rgba(255, 255, 255, 0.12)`
            }}
          >
            <span 
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 10px ${accentColor}`
              }}
            />
            <span 
              className="text-xs lg:text-sm font-black uppercase tracking-[0.25em] font-mono text-white"
              style={{
                textShadow: `0 0 10px ${accentColor}, 0 0 22px ${accentColor}95, 0 0 35px ${accentColor}50`
              }}
            >
              {title}
            </span>
          </div>
        </div>
      )}

      {/* Outer Machined Titanium Bezel Chassis */}
      <div 
        className="relative rounded-full p-[3.5px] transition-all duration-300 flex items-center justify-center select-none"
        style={{
          width: size,
          height: size,
          background: bezelConic,
          boxShadow: isRedline 
            ? '0 0 45px -5px rgba(244, 63, 94, 0.5), 0 20px 45px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.4)'
            : `0 0 35px -5px ${accentColor}35, 0 20px 45px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.3)`
        }}
      >
        {/* Recessed Dark Anodized Inner Ring */}
        <div 
          className="w-full h-full rounded-full p-[2.5px] relative flex items-center justify-center transition-all duration-300"
          style={{
            background: innerRingBg,
            boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.9), inset 0 -1px 2px rgba(255, 255, 255, 0.12)'
          }}
        >
          {/* Main Dial Face */}
          <div 
            className="w-full h-full rounded-full relative flex items-center justify-center overflow-hidden transition-all duration-300"
            style={{
              background: dialFaceBg,
              border: `1px solid ${isRose ? 'rgba(244, 63, 94, 0.15)' : 'rgba(255, 255, 255, 0.08)'}`
            }}
          >
            {/* Carbon Fibre Mesh Dial Background */}
            <div 
              className="absolute inset-0 rounded-full opacity-35 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${meshColor} 0px, ${meshColor} 2px, transparent 2px, transparent 4px)`
              }}
            />

            {/* 4 Titanium Screws */}
            <div className="absolute top-3 left-3 w-2 h-2 rounded-full bg-slate-500 border border-slate-400/50 shadow-inner" />
            <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-slate-500 border border-slate-400/50 shadow-inner" />
            <div className="absolute bottom-3 left-3 w-2 h-2 rounded-full bg-slate-500 border border-slate-400/50 shadow-inner" />
            <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-slate-500 border border-slate-400/50 shadow-inner" />

            {/* SVG Dial with Ticks, Laser Hairlines and Scale Arcs */}
            <svg className="w-full h-full relative z-10 pointer-events-none" viewBox={`0 0 ${size} ${size}`}>
              {/* Outer Deep Recessed Channel */}
              <circle
                cx={center}
                cy={center}
                r={outerRadius + 2}
                fill="none"
                stroke="#0a0f1d"
                strokeWidth="6"
              />

              {/* Concentric Precision Laser Hairlines */}
              <circle
                cx={center}
                cy={center}
                r={outerRadius + 5}
                fill="none"
                stroke="rgba(255, 255, 255, 0.14)"
                strokeWidth="1"
              />
              <circle
                cx={center}
                cy={center}
                r={outerRadius - 1}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth="1"
              />

              {/* Micro-graduation Perimeter Notches */}
              {outerPips.map((pip, idx) => (
                <line
                  key={`pip-${idx}`}
                  x1={pip.x1}
                  y1={pip.y1}
                  x2={pip.x2}
                  y2={pip.y2}
                  stroke={pip.isMajor ? 'rgba(255, 255, 255, 0.35)' : 'rgba(255, 255, 255, 0.12)'}
                  strokeWidth={pip.isMajor ? 1.5 : 1}
                />
              ))}

              {/* Dynamic Active Glowing Laser Progress Arc */}
              {activeArcPath && (
                <path
                  d={activeArcPath}
                  fill="none"
                  stroke={isRedline ? '#f43f5e' : accentColor}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  style={{
                    filter: `drop-shadow(0 0 6px ${isRedline ? '#f43f5e' : accentColor}) drop-shadow(0 0 12px ${isRedline ? '#f43f5e' : accentColor}80)`
                  }}
                />
              )}

          {/* Color Zone Arcs */}
          {zones.map((zone, idx) => {
            const zStartRatio = (zone.from - min) / (max - min);
            const zEndRatio = (zone.to - min) / (max - min);
            const zStartAngle = START_ANGLE + (zStartRatio * TOTAL_SWEEP);
            const zEndAngle = START_ANGLE + (zEndRatio * TOTAL_SWEEP);

            const startRad = ((zStartAngle - 90) * Math.PI) / 180;
            const endRad = ((zEndAngle - 90) * Math.PI) / 180;
            const arcR = outerRadius - 4;

            const x1 = center + arcR * Math.cos(startRad);
            const y1 = center + arcR * Math.sin(startRad);
            const x2 = center + arcR * Math.cos(endRad);
            const y2 = center + arcR * Math.sin(endRad);

            const largeArc = (zEndAngle - zStartAngle) > 180 ? 1 : 0;
            const d = `M ${x1} ${y1} A ${arcR} ${arcR} 0 ${largeArc} 1 ${x2} ${y2}`;

            return (
              <path
                key={idx}
                d={d}
                fill="none"
                stroke={zone.color}
                strokeWidth="4"
                strokeLinecap="round"
                opacity={ratio >= zStartRatio ? 0.95 : 0.22}
                style={{
                  filter: ratio >= zStartRatio ? `drop-shadow(0 0 5px ${zone.color})` : 'none'
                }}
              />
            );
          })}

          {/* Render Ticks and Numbers */}
          {ticks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.color}
                strokeWidth={t.isMajor ? 2.5 : 1}
                strokeLinecap="round"
                opacity={t.isMajor ? 0.9 : 0.4}
              />
              {t.isMajor && (
                <text
                  x={t.lx}
                  y={t.ly}
                  fill={t.val <= clampedValue ? '#ffffff' : '#64748b'}
                  fontSize={size > 260 ? '11' : '9'}
                  fontWeight="900"
                  fontFamily="monospace"
                  textAnchor="middle"
                  dominantBaseline="central"
                >
                  {t.val}
                </text>
              )}
            </g>
          ))}

          {/* PHYSICAL PIVOTING NEEDLE */}
          <g 
            style={{ 
              transform: `rotate(${needleAngle}deg)`,
              transformOrigin: `${center}px ${center}px`,
              transition: 'transform 0.22s cubic-bezier(0.2, 0.8, 0.4, 1.2)'
            }}
          >
            {/* Needle Glow Halo */}
            <line
              x1={center}
              y1={center}
              x2={center}
              y2={center - (outerRadius - 16)}
              stroke={isRedline ? '#f43f5e' : accentColor}
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.35"
              style={{ filter: `blur(4px)` }}
            />

            {/* Needle Shaft - Blade Shape */}
            <polygon
              points={`
                ${center - 3},${center} 
                ${center + 3},${center} 
                ${center + 1},${center - (outerRadius - 18)} 
                ${center},${center - (outerRadius - 14)} 
                ${center - 1},${center - (outerRadius - 18)}
              `}
              fill={isRedline ? '#f43f5e' : accentColor}
              style={{
                filter: `drop-shadow(0 0 6px ${isRedline ? '#f43f5e' : accentColor})`
              }}
            />

            {/* Counterweight Tail */}
            <polygon
              points={`
                ${center - 3},${center} 
                ${center + 3},${center} 
                ${center + 2},${center + 18} 
                ${center - 2},${center + 18}
              `}
              fill="#334155"
            />
          </g>

          {/* Central Pivot Hub Ring (Sleek Open Center with Metallic Bezel) */}
          <circle
            cx={center}
            cy={center}
            r="16"
            fill="#080c14"
            stroke="#334155"
            strokeWidth="2.5"
          />
          <circle
            cx={center}
            cy={center}
            r="8"
            fill={isRedline ? '#f43f5e' : accentColor}
            style={{
              filter: `drop-shadow(0 0 6px ${isRedline ? '#f43f5e' : accentColor})`
            }}
          />
          <circle
            cx={center}
            cy={center}
            r="3"
            fill="#ffffff"
          />
        </svg>

        {/* SEAMLESS IN-DIAL TELEMETRY READOUT (EMBUTIDO DIRETAMENTE NO MOSTRADOR) */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-8 pointer-events-none">
          {/* Bottom Dial Engraving: Large Integrated Value and Unit */}
          <div className="flex flex-col items-center mb-1">
            <div className="flex items-baseline">
              <span 
                className="text-4xl lg:text-5xl font-black font-mono tracking-tighter text-white"
                style={{
                  textShadow: `0 0 20px ${isRedline ? '#f43f5e' : accentColor}75`
                }}
              >
                {formattedValue}
              </span>
            </div>
            <span 
              className="text-xs font-black tracking-widest uppercase font-mono mt-0.5"
              style={{ color: isRedline ? '#f43f5e' : accentColor }}
            >
              {unit}
            </span>
          </div>
        </div>

        {/* Warning Shift Light / Peak LED */}
        {isRedline && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-rose-500/20 border border-rose-500 px-2 py-0.5 rounded-full animate-bounce shadow-[0_0_12px_rgba(244,63,94,0.6)]">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            <span className="text-[9px] font-black text-rose-300 uppercase tracking-widest">
              REDLINE
            </span>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
