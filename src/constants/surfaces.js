// Shared "instrument panel" surface for the live cockpit cards (timer + gauge cluster).
// Matte, layered dark glass with a hairline border and a soft top highlight; the accent
// colour is only used as a faint top edge so the live data stays the brightest thing on screen.

export function premiumSurfaceStyle(isRose, accent) {
  return {
    background: isRose
      ? 'linear-gradient(180deg, rgba(46, 10, 56, 0.78) 0%, rgba(20, 4, 28, 0.92) 100%)'
      : 'linear-gradient(180deg, rgba(17, 24, 39, 0.72) 0%, rgba(7, 11, 19, 0.9) 100%)',
    border: `1px solid ${isRose ? 'rgba(255, 133, 179, 0.14)' : 'rgba(255, 255, 255, 0.07)'}`,
    boxShadow: [
      'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      '0 1px 0 rgba(255, 255, 255, 0.02)',
      '0 40px 80px -40px rgba(0, 0, 0, 0.95)',
      `0 0 80px -50px ${accent}`
    ].join(', '),
    backdropFilter: 'blur(24px) saturate(140%)',
    WebkitBackdropFilter: 'blur(24px) saturate(140%)'
  };
}

export function accentHairlineStyle(accent, accent2 = accent) {
  return {
    background: `linear-gradient(90deg, transparent 0%, ${accent}66 30%, ${accent2}66 70%, transparent 100%)`
  };
}
