// Theme definitions for Merach Bike Dashboard (Cyber Cyan vs Rosa & DarkViolet)

export const THEMES = {
  cyan: {
    id: 'cyan',
    name: 'Cyber Cyan & Emerald',
    shortName: 'Cyan',
    previewColor: '#38bdf8',
    previewAccent: '#10b981',
    // App Background
    bgBody: '#080c14',
    bgAppClass: 'bg-[#080c14]',
    ambientGlow1: 'bg-sky-500/15',
    ambientGlow2: 'bg-emerald-500/15',
    // Cluster & Cards
    clusterBg: 'linear-gradient(135deg, rgba(15, 23, 42, 0.88) 0%, rgba(8, 12, 20, 0.96) 50%, rgba(5, 8, 14, 0.99) 100%)',
    clusterBorder: 'rgba(56, 189, 248, 0.25)',
    clusterShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 0 35px -5px rgba(56, 189, 248, 0.25)',
    hudCardBg: 'linear-gradient(180deg, rgba(12, 18, 30, 0.95) 0%, rgba(6, 10, 18, 0.98) 100%)',
    hudCardBorder: 'rgba(56, 189, 248, 0.35)',
    metricItemBg: 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700',
    // Gauge Dial Face
    gaugeDialBg: 'radial-gradient(circle at 50% 50%, #151e2d 0%, #0c121d 65%, #05080e 100%)',
    gaugeInnerRing: 'linear-gradient(145deg, #1e293b 0%, #090e17 50%, #030712 100%)',
    gaugeBezelConic: 'conic-gradient(from 210deg at 50% 50%, #475569 0deg, #38bdf8 45deg, #1e293b 90deg, #64748b 150deg, #1e293b 210deg, #38bdf8 270deg, #334155 330deg, #475569 360deg)',
    gaugeMeshColor: 'rgba(255,255,255,0.035)',
    // Speedometer
    speedAccent: '#38bdf8',
    speedZones: [
      { from: 0, to: 18, color: '#64748b' },
      { from: 18, to: 30, color: '#38bdf8' },
      { from: 30, to: 42, color: '#10b981' },
      { from: 42, to: 52, color: '#fbbf24' },
      { from: 52, to: 60, color: '#f43f5e' }
    ],
    // Cadence Tachometer
    cadenceAccent: '#10b981',
    cadenceZones: [
      { from: 0, to: 65, color: '#64748b' },
      { from: 65, to: 80, color: '#38bdf8' },
      { from: 80, to: 95, color: '#10b981' },
      { from: 95, to: 110, color: '#fbbf24' },
      { from: 110, to: 140, color: '#f43f5e' }
    ],
    // HUD & Metrics
    distanceColor: '#38bdf8',
    caloriesColor: '#fbbf24',
    glowColor: 'rgba(56, 189, 248, 0.25)',
    chartSpeedStroke: '#38bdf8',
    chartCadenceStroke: '#10b981',
    primaryButtonGrad: 'from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400',
    primaryButtonShadow: 'shadow-emerald-500/25 hover:shadow-emerald-500/40',
    // Modals
    modalPanelClass: 'bg-slate-950/92 border-sky-500/30 shadow-[0_0_40px_-5px_rgba(56,189,248,0.25)]',
    modalCardClass: 'bg-slate-900/80 border-slate-800 text-slate-100',
    modalInputClass: 'bg-slate-900/90 border-slate-800 focus:border-sky-500 text-white',
    modalHeaderBadge: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  },
  rose: {
    id: 'rose',
    name: 'Rosa & DarkViolet',
    shortName: 'Rosa & Violet',
    previewColor: '#ff2d75',
    previewAccent: '#9400D3',
    // App Background (Luminous Dark Violet & Pink)
    bgBody: '#16021f',
    bgAppClass: 'bg-[#16021f]',
    ambientGlow1: 'bg-[#ff2d75]/30',
    ambientGlow2: 'bg-[#9400D3]/35',
    // Cluster & Cards
    clusterBg: 'linear-gradient(135deg, rgba(48, 8, 56, 0.95) 0%, rgba(28, 4, 38, 0.98) 50%, rgba(18, 2, 26, 0.99) 100%)',
    clusterBorder: 'rgba(255, 45, 117, 0.5)',
    clusterShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), inset 0 1px 2px 0 rgba(255, 45, 117, 0.3), 0 0 55px -5px rgba(148, 0, 211, 0.5)',
    hudCardBg: 'linear-gradient(180deg, rgba(42, 6, 52, 0.96) 0%, rgba(24, 3, 34, 0.99) 100%)',
    hudCardBorder: 'rgba(255, 45, 117, 0.55)',
    metricItemBg: 'bg-[#2b0536]/85 border-[#ff2d75]/40 hover:border-[#ff2d75]/70',
    // Gauge Dial Face (Rosa & DarkViolet #9400D3)
    gaugeDialBg: 'radial-gradient(circle at 50% 50%, #3e0747 0%, #25042f 65%, #13011a 100%)',
    gaugeInnerRing: 'linear-gradient(145deg, #520b64 0%, #2c0337 50%, #15011e 100%)',
    gaugeBezelConic: 'conic-gradient(from 210deg at 50% 50%, #9400D3 0deg, #ff2d75 45deg, #3e0747 90deg, #9400D3 150deg, #25042f 210deg, #ff2d75 270deg, #9400D3 330deg, #ff2d75 360deg)',
    gaugeMeshColor: 'rgba(255, 45, 117, 0.08)',
    // Speedometer (Rosa vibrante)
    speedAccent: '#ff2d75',
    speedZones: [
      { from: 0, to: 18, color: '#64748b' },
      { from: 18, to: 30, color: '#ff85b3' },
      { from: 30, to: 42, color: '#ff2d75' },
      { from: 42, to: 52, color: '#9400D3' },
      { from: 52, to: 60, color: '#d946ef' }
    ],
    // Cadence Tachometer (DarkViolet #9400D3)
    cadenceAccent: '#9400D3',
    cadenceZones: [
      { from: 0, to: 65, color: '#64748b' },
      { from: 65, to: 80, color: '#c084fc' },
      { from: 80, to: 95, color: '#9400D3' },
      { from: 95, to: 110, color: '#ff2d75' },
      { from: 110, to: 140, color: '#ff85b3' }
    ],
    // HUD & Metrics
    distanceColor: '#ff2d75',
    caloriesColor: '#9400D3',
    glowColor: 'rgba(255, 45, 117, 0.45)',
    chartSpeedStroke: '#ff2d75',
    chartCadenceStroke: '#9400D3',
    primaryButtonGrad: 'from-[#ff2d75] to-[#9400D3] hover:from-[#ff4585] hover:to-[#a916eb]',
    primaryButtonShadow: 'shadow-[0_0_30px_rgba(148,0,211,0.55)]',
    // Modals (Visualmente vibrantes, não escuros!)
    modalPanelClass: 'bg-gradient-to-b from-[#2e063b]/98 to-[#1a0226]/98 border-[#ff2d75]/55 shadow-[0_0_75px_rgba(148,0,211,0.55),_0_0_35px_rgba(255,45,117,0.45)]',
    modalCardClass: 'bg-[#380743]/75 border-[#ff2d75]/40 text-pink-100 hover:border-[#ff2d75]/70 shadow-sm',
    modalInputClass: 'bg-[#290534] border-[#ff2d75]/45 text-white focus:border-[#ff2d75] focus:ring-1 focus:ring-[#ff2d75]',
    modalHeaderBadge: 'bg-[#ff2d75]/25 text-[#ff85b3] border-[#ff2d75]/50'
  }
};
