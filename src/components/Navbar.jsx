import React from 'react';
import {
  Bike,
  Activity,
  Cpu,
  Radio,
  Settings,
  LineChart,
  ChevronUp,
  Gauge,
  Map
} from 'lucide-react';

// Segmented control used for the main tabs and the cockpit mode switch
function Segmented({ items, value, onChange, accent }) {
  return (
    <div
      className="flex items-center gap-0.5 p-[3px] rounded-[14px]"
      style={{
        background: 'rgba(0,0,0,0.32)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), 0 1px 0 rgba(255,255,255,0.03)'
      }}
    >
      {items.map(({ id, label, icon: Icon, title }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            title={title || label}
            className={`relative flex items-center gap-1.5 px-3.5 tab:px-3 py-[7px] rounded-[11px] whitespace-nowrap text-[12px] font-medium tracking-[0.01em] transition-all duration-200 cursor-pointer ${
              active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
            style={active ? {
              background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px rgba(255,255,255,0.07), 0 4px 12px -4px rgba(0,0,0,0.8)'
            } : undefined}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" style={active ? { color: accent } : undefined} />
            <span className="hidden sm:inline">{label}</span>
            {active && (
              <span
                className="absolute left-1/2 -translate-x-1/2 -bottom-[3px] w-4 h-[2px] rounded-full"
                style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

const iconButtonClass =
  'h-9 shrink-0 whitespace-nowrap rounded-xl flex items-center justify-center gap-2 text-slate-300 hover:text-white transition-all duration-200 cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] ring-1 ring-white/[0.08] hover:ring-white/[0.14] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]';

export default function Navbar({
  activeTab,
  setActiveTab,
  dashboardMode = 'gauges',
  onToggleDashboardMode,
  onSetDashboardMode,
  mode,
  workoutStatus,
  elapsedTimeFormatted,
  onOpenSettings,
  currentTheme = 'cyan',
  onToggleTheme,
  onToggleCollapse
}) {
  const isRose = currentTheme === 'rose';
  const accent = isRose ? '#ff2d75' : '#38bdf8';
  const accent2 = isRose ? '#9400D3' : '#34d399';
  const isLiveSession = workoutStatus === 'running' || workoutStatus === 'paused';

  return (
    <header
      className="sticky top-0 z-40 w-full px-3 sm:px-4 lg:px-8 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] tab:px-5 tab:pb-2.5 tab:pt-[calc(0.625rem+env(safe-area-inset-top))]"
      style={{
        background: isRose
          ? 'linear-gradient(180deg, rgba(24,4,32,0.86) 0%, rgba(24,4,32,0.68) 100%)'
          : 'linear-gradient(180deg, rgba(8,12,20,0.86) 0%, rgba(8,12,20,0.66) 100%)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.06), 0 12px 32px -16px rgba(0,0,0,0.9)'
      }}
    >
      {/* Accent hairline along the bottom edge */}
      <div
        className="absolute bottom-0 inset-x-0 h-px pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent 5%, ${accent}55 35%, ${accent2}55 65%, transparent 95%)` }}
      />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Brand */}
        <button type="button" onClick={() => setActiveTab('live')} className="group shrink-0 flex items-center gap-3 cursor-pointer">
          <span
            className="w-9 h-9 rounded-[11px] p-px transition-shadow"
            style={{
              background: `linear-gradient(140deg, ${accent} 0%, ${accent2} 100%)`,
              boxShadow: `0 6px 18px -6px ${accent}`
            }}
          >
            <span className="w-full h-full rounded-[10px] flex items-center justify-center bg-[#070b12] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Bike className="w-[18px] h-[18px] transition-transform group-hover:scale-110" style={{ color: accent }} strokeWidth={2.2} />
            </span>
          </span>
          <span className="flex flex-col items-start leading-none whitespace-nowrap">
            <span className="text-[14px] tracking-[0.3em] text-white">
              <span className="font-bold">MERACH</span>
              <span className="font-light ml-1.5" style={{ color: accent }}>BIKE</span>
            </span>
            <span className="hidden sm:block tab:hidden mt-1.5 text-[9px] font-medium uppercase tracking-[0.34em] text-slate-500">
              Smart Cycling Telemetry
            </span>
          </span>
        </button>

        {/* Live session badge (desktop) */}
        {isLiveSession && (
          <div
            className="hidden 2xl:flex shrink-0 whitespace-nowrap items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold tabular-nums tracking-[0.12em] text-slate-200 bg-white/[0.04] ring-1 ring-white/[0.08]"
          >
            <span className="relative flex w-2 h-2">
              {workoutStatus === 'running' && <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-70" />}
              <span className={`relative w-2 h-2 rounded-full ${workoutStatus === 'running' ? 'bg-rose-500' : 'bg-amber-400'}`} />
            </span>
            <span className="uppercase text-slate-400">{workoutStatus === 'running' ? 'Ao vivo' : 'Pausa'}</span>
            <span className="text-white">{elapsedTimeFormatted}</span>
          </div>
        )}

        {/* Main tabs (desktop / tablet) */}
        <div className="hidden md:block">
          <Segmented
            accent={accent}
            value={activeTab}
            onChange={setActiveTab}
            items={[
              { id: 'live', label: 'Treino em Direto', icon: Activity },
              { id: 'analytics', label: 'Estatísticas', icon: LineChart, title: 'Estatísticas & Registos' }
            ]}
          />
        </div>

        {/* Cockpit mode switch */}
        {activeTab === 'live' && (
          <Segmented
            accent={accent}
            value={dashboardMode}
            onChange={(id) => (onSetDashboardMode ? onSetDashboardMode(id) : onToggleDashboardMode?.())}
            items={[
              { id: 'gauges', label: 'Manómetros', icon: Gauge, title: 'Modo Manómetros e Telemetria' },
              { id: 'route', label: 'Percurso 3D', icon: Map, title: 'Modo Percurso Real 3D / GPS' }
            ]}
          />
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Theme */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`${iconButtonClass} px-3`}
            title={`Tema: ${isRose ? 'Rosa & DarkViolet' : 'Cyber Cyan'} (tocar para alternar)`}
          >
            <span className="flex items-center -space-x-1">
              <span className="w-3 h-3 rounded-full ring-2 ring-[#0b1018]" style={{ background: accent }} />
              <span className="w-3 h-3 rounded-full ring-2 ring-[#0b1018]" style={{ background: accent2 }} />
            </span>
            <span className="hidden sm:inline tab:hidden text-[12px] font-medium">{isRose ? 'Rosa' : 'Cyan'}</span>
          </button>

          {/* Data source */}
          <button
            type="button"
            onClick={onOpenSettings}
            className={`${iconButtonClass} px-3`}
            title={mode === 'simulation' ? 'Fonte: Simulador' : 'Fonte: Home Assistant'}
          >
            <span className="relative flex w-1.5 h-1.5">
              <span className={`relative w-1.5 h-1.5 rounded-full ${mode === 'simulation' ? 'bg-slate-400' : 'bg-emerald-400 shadow-[0_0_6px_#34d399]'}`} />
            </span>
            {mode === 'simulation' ? (
              <Cpu className="w-3.5 h-3.5" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-emerald-300" />
            )}
            <span className="hidden sm:inline tab:hidden text-[12px] font-medium">
              {mode === 'simulation' ? 'Simulador' : 'Home Assistant'}
            </span>
          </button>

          {/* Settings */}
          <button type="button" onClick={onOpenSettings} className={`${iconButtonClass} w-9`} title="Configurações de Sensores e Perfil">
            <Settings className="w-4 h-4" />
          </button>

          {/* Collapse for cockpit immersion */}
          {isLiveSession && (
            <button type="button" onClick={onToggleCollapse} className={`${iconButtonClass} px-2.5`} title="Ocultar barra superior">
              <ChevronUp className="w-4 h-4" />
              <span className="hidden sm:inline tab:hidden text-[12px] font-medium">Ocultar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
