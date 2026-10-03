import React from 'react';

export default function MetricCard({
  title,
  subtitle,
  value,
  unit,
  icon: Icon,
  accentColor = 'sky', // 'sky', 'emerald', 'amber', 'rose', 'indigo'
  badge,
  progressPercentage,
  footerText
}) {
  const colorMap = {
    sky: {
      border: 'hover:border-sky-500/40',
      iconBg: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(56,189,248,0.3)]',
      textAccent: 'text-sky-400',
      barBg: 'bg-sky-400',
      ambient: 'rgba(56, 189, 248, 0.08)'
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(52,211,153,0.3)]',
      textAccent: 'text-emerald-400',
      barBg: 'bg-emerald-400',
      ambient: 'rgba(52, 211, 153, 0.08)'
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(251,191,36,0.3)]',
      textAccent: 'text-amber-400',
      barBg: 'bg-amber-400',
      ambient: 'rgba(251, 191, 36, 0.08)'
    },
    rose: {
      border: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(244,63,94,0.3)]',
      textAccent: 'text-rose-400',
      barBg: 'bg-rose-400',
      ambient: 'rgba(244, 63, 94, 0.08)'
    },
    indigo: {
      border: 'hover:border-indigo-500/40',
      iconBg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
      glow: 'group-hover:shadow-[0_0_25px_-5px_rgba(129,140,248,0.3)]',
      textAccent: 'text-indigo-400',
      barBg: 'bg-indigo-400',
      ambient: 'rgba(129, 140, 248, 0.08)'
    }
  };

  const scheme = colorMap[accentColor] || colorMap.sky;

  return (
    <div 
      className={`relative glass-panel rounded-2xl p-5 border border-slate-800/80 transition-all duration-300 group overflow-hidden ${scheme.border} ${scheme.glow}`}
    >
      {/* Soft ambient background spotlight */}
      <div 
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-opacity duration-300 opacity-60 group-hover:opacity-100"
        style={{ backgroundColor: scheme.ambient }}
      />

      <div className="flex items-start justify-between mb-3 relative z-10">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ${scheme.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
            {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60">
            {badge}
          </span>
        )}
      </div>

      {/* Main Metric Display */}
      <div className="flex items-baseline gap-1.5 my-2 relative z-10">
        <span className="text-4xl lg:text-5xl font-black tracking-tight text-white font-mono">
          {value}
        </span>
        {unit && (
          <span className="text-sm lg:text-base font-semibold text-slate-400 font-sans">
            {unit}
          </span>
        )}
      </div>

      {/* Mini Progress or target bar if provided */}
      {progressPercentage !== undefined && (
        <div className="w-full mt-3 relative z-10">
          <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ease-out ${scheme.barBg}`}
              style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Text */}
      {footerText && (
        <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between relative z-10">
          <span>{footerText}</span>
        </div>
      )}
    </div>
  );
}
