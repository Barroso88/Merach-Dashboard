import React from 'react';
import {
  Bike,
  Activity,
  Cpu,
  Radio,
  Settings,
  LineChart,
  Palette,
  ChevronUp
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  mode,
  workoutStatus,
  elapsedTimeFormatted,
  onOpenSettings,
  currentTheme = 'cyan',
  onToggleTheme,
  isCollapsed = false,
  onToggleCollapse
}) {
  const isRose = currentTheme === 'rose';

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer" onClick={() => setActiveTab('live')}>
            <div className={`w-10 h-10 rounded-2xl p-0.5 shadow-lg transition-all ${
              isRose 
                ? 'bg-gradient-to-br from-[#ff2d75] to-[#9400D3] shadow-[#ff2d75]/30 group-hover:shadow-[#ff2d75]/50' 
                : 'bg-gradient-to-br from-sky-400 to-emerald-400 shadow-sky-500/20 group-hover:shadow-sky-500/40'
            }`}>
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Bike className={`w-5 h-5 group-hover:scale-110 transition-transform ${isRose ? 'text-[#ff2d75]' : 'text-sky-400'}`} />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">MERACH</span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border tracking-widest uppercase transition-colors ${
                isRose 
                  ? 'bg-[#ff2d75]/20 text-[#ff85b3] border-[#ff2d75]/40' 
                  : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
              }`}>
                BIKE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide">
              Smart Cycling Telemetry
            </p>
          </div>
        </div>

        {/* Live Active Status Indicator (if running) */}
        {workoutStatus === 'running' && (
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold animate-pulse ${
            isRose
              ? 'bg-[#ff2d75]/15 border-[#ff2d75]/40 text-[#ff85b3]'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isRose ? 'bg-[#ff2d75]' : 'bg-emerald-400'}`} />
            <span>SESSÃO EM DIRETO: {elapsedTimeFormatted}</span>
          </div>
        )}

        {/* Navigation Tabs (Desktop Top) */}
        <div className={`hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl border ${
          isRose ? 'bg-[#290534]/70 border-[#ff2d75]/30' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'live'
                ? isRose 
                  ? 'bg-[#ff2d75]/25 text-[#ff85b3] border border-[#ff2d75]/50 shadow-sm'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Treino em Direto
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? isRose
                  ? 'bg-[#9400D3]/30 text-purple-200 border border-[#9400D3]/50 shadow-sm'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            Estatísticas & Registos
          </button>
        </div>

        {/* Right Actions: Theme Switcher, Connection Badge & Settings */}
        <div className="flex items-center gap-2.5">
          {/* THEME SWITCHER BUTTON (Cyan vs Rosa & DarkViolet) */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
              isRose
                ? 'bg-[#ff2d75]/20 border-[#ff2d75]/50 text-[#ff85b3] hover:bg-[#ff2d75]/30 shadow-[#ff2d75]/20'
                : 'bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25 shadow-sky-500/10'
            }`}
            title="Alternar Tema: Cyber Cyan vs Rosa & DarkViolet"
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-sans">
              {isRose ? 'Rosa & DarkViolet' : 'Cyber Cyan'}
            </span>
            <div className="flex items-center -space-x-1">
              <span className={`w-2.5 h-2.5 rounded-full border border-slate-900 ${isRose ? 'bg-[#ff2d75] scale-110 ring-1 ring-[#ff2d75]' : 'bg-sky-400'}`} />
              <span className={`w-2.5 h-2.5 rounded-full border border-slate-900 ${isRose ? 'bg-[#9400D3] scale-110 ring-1 ring-[#9400D3]' : 'bg-emerald-400 scale-110 ring-1 ring-emerald-400'}`} />
            </div>
          </button>

          {/* Connection Mode Pill */}
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              mode === 'simulation'
                ? 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:text-white'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
            }`}
            title="Alternar Modo / Configurações"
          >
            {mode === 'simulation' ? (
              <>
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Simulador</span>
              </>
            ) : (
              <>
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Home Assistant</span>
              </>
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white border border-slate-700/60 transition-all cursor-pointer"
            title="Configurações de Sensores e Perfil"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Cockpit Mode Collapse Button (when running or paused) */}
          {(workoutStatus === 'running' || workoutStatus === 'paused') && (
            <button
              onClick={onToggleCollapse}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                isRose
                  ? 'bg-[#380743]/85 hover:bg-[#4d0a5e] border-[#ff2d75]/50 text-[#ff85b3] hover:text-white shadow-[0_0_12px_rgba(255,45,117,0.25)]'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 border-sky-500/40 text-sky-300 hover:text-white shadow-[0_0_12px_rgba(56,189,248,0.2)]'
              }`}
              title="Ocultar barra superior para modo cockpit"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ocultar Barra</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
