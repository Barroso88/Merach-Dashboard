// Shared "instrument panel" surface for the live cockpit cards (timer + gauge cluster).
// Matte, layered dark glass with a hairline border and a soft top highlight; the accent
// colour is only used as a faint top edge so the live data stays the brightest thing on screen.

export function premiumSurfaceStyle(isRose, accent) {
  return {
    // Lit from above: lighter top edge fading into a deep base
    background: isRose
      ? 'linear-gradient(180deg, rgba(70, 18, 84, 0.86) 0%, rgba(38, 8, 50, 0.9) 38%, rgba(16, 3, 22, 0.96) 100%)'
      : 'linear-gradient(180deg, rgba(36, 48, 70, 0.82) 0%, rgba(17, 25, 40, 0.88) 38%, rgba(6, 10, 17, 0.96) 100%)',
    border: `1px solid ${isRose ? 'rgba(255, 133, 179, 0.16)' : 'rgba(255, 255, 255, 0.08)'}`,
    boxShadow: [
      // bevel: bright top lip, dark bottom lip
      'inset 0 1px 0 rgba(255, 255, 255, 0.16)',
      'inset 0 2px 12px -6px rgba(255, 255, 255, 0.12)',
      'inset 0 -2px 0 rgba(0, 0, 0, 0.45)',
      // layered drop shadows: contact, mid, ambient
      '0 2px 3px rgba(0, 0, 0, 0.45)',
      '0 14px 28px -10px rgba(0, 0, 0, 0.75)',
      '0 44px 80px -36px rgba(0, 0, 0, 0.95)',
      `0 0 80px -46px ${accent}`
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
