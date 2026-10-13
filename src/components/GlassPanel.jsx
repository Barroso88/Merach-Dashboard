import React from 'react';

// Professional glassmorphism panel: rounded frosted glass over the ambient background,
// gradient light-edge border, specular sheen on top, soft inner accent light and
// layered floating shadows.

export default function GlassPanel({
  children,
  className = '',
  innerClassName = '',
  radius = 28,
  accent = '#38bdf8',
  accent2,
  isRose = false,
  elevation = 'high'
}) {
  const second = accent2 || accent;

  const shadow = elevation === 'high'
    ? `0 1px 2px rgba(0,0,0,0.3), 0 14px 30px -12px rgba(0,0,0,0.6), 0 44px 90px -40px rgba(0,0,0,0.85), 0 0 80px -46px ${accent}`
    : '0 1px 2px rgba(0,0,0,0.3), 0 10px 22px -10px rgba(0,0,0,0.55), 0 28px 50px -30px rgba(0,0,0,0.8)';

  return (
    <div className={`relative ${className}`} style={{ borderRadius: radius, boxShadow: shadow }}>
      {/* Frosted glass body */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          borderRadius: radius,
          background: isRose
            ? 'linear-gradient(160deg, rgba(110, 34, 130, 0.38) 0%, rgba(52, 12, 66, 0.34) 45%, rgba(22, 4, 30, 0.52) 100%)'
            : 'linear-gradient(160deg, rgba(71, 89, 122, 0.30) 0%, rgba(28, 40, 62, 0.30) 45%, rgba(8, 13, 24, 0.52) 100%)',
          backdropFilter: 'blur(28px) saturate(200%) brightness(1.08)',
          WebkitBackdropFilter: 'blur(28px) saturate(200%) brightness(1.08)',
          // Liquid glass: crisp inner top rim, thick-glass inner glow, bottom bounce light
          boxShadow: [
            'inset 0 1.5px 0 rgba(255,255,255,0.45)',
            'inset 0 -1.5px 0 rgba(255,255,255,0.16)',
            'inset 0 18px 28px -20px rgba(255,255,255,0.28)',
            'inset 0 -22px 34px -24px rgba(255,255,255,0.10)',
            'inset 1.5px 0 0 rgba(255,255,255,0.08)',
            'inset -1.5px 0 0 rgba(255,255,255,0.05)',
            'inset 0 -50px 80px -60px rgba(0,0,0,0.75)'
          ].join(', ')
        }}
      >
        {/* Curved specular highlight across the upper half */}
        <div
          className="absolute top-[2px] left-[2%] right-[2%] h-[42%]"
          style={{
            borderRadius: `${radius}px ${radius}px 50% 50% / ${radius}px ${radius}px 22% 22%`,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.04) 55%, transparent 100%)'
          }}
        />
        {/* Glint in the top-left corner */}
        <div
          className="absolute -top-6 -left-6 w-40 h-24 rounded-full blur-2xl"
          style={{ opacity: elevation === 'high' ? 0.4 : 0.18, background: 'radial-gradient(closest-side, rgba(255,255,255,0.35), transparent)' }}
        />
        {/* Bounce-light reflection along the bottom edge */}
        <div className="absolute bottom-[2px] left-[10%] right-[10%] h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        {/* Soft inner accent lights */}
        <div className="absolute -top-1/3 -left-[15%] w-[55%] h-[80%] rounded-full blur-3xl opacity-[0.16]" style={{ background: accent }} />
        <div className="absolute -bottom-1/3 -right-[15%] w-[55%] h-[80%] rounded-full blur-3xl opacity-[0.12]" style={{ background: second }} />
      </div>

      {/* Gradient light-edge border (1px ring masked to the outline) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: radius,
          padding: 1,
          background: `linear-gradient(160deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.14) 26%, rgba(255,255,255,0.05) 58%, rgba(255,255,255,0.22) 88%, ${second}77 100%)`,
          WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          mask: 'linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)'
        }}
      />

      {/* Content */}
      <div className={`relative h-full ${innerClassName}`}>{children}</div>
    </div>
  );
}
