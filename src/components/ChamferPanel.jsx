import React from 'react';

// Machined panel with 45° chamfered corners: a bevelled rim (lit from the top-left),
// a recessed top-lit surface inside it, shadows that follow the cut shape and small
// accent LEDs on two of the chamfers.

export function chamferPath(cut) {
  return `polygon(${cut}px 0, calc(100% - ${cut}px) 0, 100% ${cut}px, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, ${cut}px 100%, 0 calc(100% - ${cut}px), 0 ${cut}px)`;
}

export default function ChamferPanel({
  children,
  className = '',
  innerClassName = '',
  cut = 22,
  bevel = 2,
  accent = '#38bdf8',
  accent2,
  isRose = false,
  leds = true,
  elevation = 'high'
}) {
  // Inner polygon keeps the chamfer edges parallel to the rim
  const innerCut = Math.max(0, cut - bevel * 0.59);
  const ledLen = cut * 0.85;
  const second = accent2 || accent;

  const shadow = elevation === 'high'
    ? `drop-shadow(0 2px 2px rgba(0,0,0,0.55)) drop-shadow(0 16px 22px rgba(0,0,0,0.6)) drop-shadow(0 0 28px ${accent}26)`
    : 'drop-shadow(0 2px 2px rgba(0,0,0,0.5)) drop-shadow(0 10px 14px rgba(0,0,0,0.55))';

  return (
    <div className={`relative ${className}`} style={{ filter: shadow }}>
      {/* Bevelled rim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          clipPath: chamferPath(cut),
          background: `linear-gradient(155deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.14) 20%, rgba(255,255,255,0.04) 48%, rgba(0,0,0,0.5) 78%, rgba(0,0,0,0.75) 100%), ${isRose ? '#4a1656' : '#253247'}`
        }}
      />

      {/* Recessed surface */}
      <div
        className={`relative h-full ${innerClassName}`}
        style={{
          margin: bevel,
          clipPath: chamferPath(innerCut),
          background: isRose
            ? 'linear-gradient(180deg, #3a1245 0%, #250b2f 38%, #13041b 100%)'
            : 'linear-gradient(180deg, #1d283b 0%, #131c2c 38%, #080d15 100%)',
          boxShadow: [
            'inset 0 1px 0 rgba(255,255,255,0.16)',
            'inset 1px 0 0 rgba(255,255,255,0.05)',
            'inset 0 -2px 0 rgba(0,0,0,0.5)',
            'inset 0 0 44px rgba(0,0,0,0.38)'
          ].join(', ')
        }}
      >
        {children}
      </div>

      {/* Accent LEDs on the top-left and bottom-right chamfers */}
      {leds && cut >= 12 && (
        <>
          <span
            className="absolute pointer-events-none rounded-full"
            style={{
              width: ledLen,
              height: 2,
              left: cut / 2 - ledLen / 2,
              top: cut / 2 - 1,
              transform: 'rotate(-45deg)',
              background: accent,
              boxShadow: `0 0 6px ${accent}, 0 0 14px ${accent}`
            }}
          />
          <span
            className="absolute pointer-events-none rounded-full"
            style={{
              width: ledLen,
              height: 2,
              right: cut / 2 - ledLen / 2,
              bottom: cut / 2 - 1,
              transform: 'rotate(-45deg)',
              background: second,
              boxShadow: `0 0 6px ${second}, 0 0 14px ${second}`
            }}
          />
        </>
      )}
    </div>
  );
}
