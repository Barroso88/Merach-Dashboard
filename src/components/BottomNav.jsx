import React from 'react';
import { Activity, LineChart, Settings, Sliders } from 'lucide-react';

export default function BottomNav({
  activeTab,
  setActiveTab,
  onOpenSettings,
  workoutStatus,
  currentTheme = 'cyan'
}) {
  const isRose = currentTheme === 'rose';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-800/90 px-4 py-2 backdrop-blur-2xl">
      <div className="flex items-center justify-around">
        <button
          onClick={() => setActiveTab('live')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'live'
              ? isRose ? 'text-[#ff2d75] font-bold' : 'text-sky-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <Activity className="w-5 h-5" />
            {workoutStatus === 'running' && (
              <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping ${isRose ? 'bg-[#ff2d75]' : 'bg-emerald-400'}`} />
            )}
          </div>
          <span className="text-[10px]">Treino em Direto</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? isRose ? 'text-[#9400D3] font-bold' : 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LineChart className="w-5 h-5" />
          <span className="text-[10px]">Estatísticas & Registos</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px]">Sensores / HA</span>
        </button>
      </div>
    </nav>
  );
}
