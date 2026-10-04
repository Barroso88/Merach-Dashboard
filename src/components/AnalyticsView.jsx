import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Flame,
  Gauge,
  TrendingUp,
  Trash2,
  Eye,
  Download,
  BarChart3,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

export default function AnalyticsView({
  workouts = [],
  onDeleteWorkout,
  onSelectWorkout,
  themeConfig
}) {
  const isRose = themeConfig?.id === 'rose';
  const [period, setPeriod] = useState('weekly'); // 'daily', 'weekly', 'monthly', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [metricTab, setMetricTab] = useState('distance'); // 'distance', 'calories', 'speed'

  // Filter workouts by selected period
  const filteredWorkouts = useMemo(() => {
    const now = new Date();
    return workouts.filter((w) => {
      const workoutDate = new Date(w.date);

      if (searchTerm) {
        const titleMatch = w.title?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!titleMatch) return false;
      }

      if (period === 'all') return true;

      if (period === 'daily') {
        return (
          workoutDate.getDate() === now.getDate() &&
          workoutDate.getMonth() === now.getMonth() &&
          workoutDate.getFullYear() === now.getFullYear()
        );
      }

      if (period === 'weekly') {
        const diffDays = (now - workoutDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 7;
      }

      if (period === 'monthly') {
        const diffDays = (now - workoutDate) / (1000 * 60 * 60 * 24);
        return diffDays <= 30;
      }

      return true;
    });
  }, [workouts, period, searchTerm]);

  // Summary statistics for the filtered period
  const stats = useMemo(() => {
    const totalCount = filteredWorkouts.length;
    const totalDurationSeconds = filteredWorkouts.reduce((sum, w) => sum + (w.durationSeconds || 0), 0);
    const totalDistance = Number(filteredWorkouts.reduce((sum, w) => sum + (w.distanceKm || 0), 0).toFixed(1));
    const totalCalories = filteredWorkouts.reduce((sum, w) => sum + (w.caloriesKcal || 0), 0);
    
    const avgSpeed = totalCount > 0
      ? Number((filteredWorkouts.reduce((sum, w) => sum + (w.avgSpeed || 0), 0) / totalCount).toFixed(1))
      : 0;
    const maxSpeedRecorded = totalCount > 0
      ? Math.max(...filteredWorkouts.map(w => w.maxSpeed || w.avgSpeed || 0))
      : 0;

    const avgCadence = totalCount > 0
      ? Math.round(filteredWorkouts.reduce((sum, w) => sum + (w.avgCadence || 0), 0) / totalCount)
      : 0;

    const formatTotalTime = (secs) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    };

    return {
      totalCount,
      totalTimeFormatted: formatTotalTime(totalDurationSeconds),
      totalDistance,
      totalCalories,
      avgSpeed,
      maxSpeedRecorded,
      avgCadence
    };
  }, [filteredWorkouts]);

  // Chart data formatted chronologically (oldest to newest)
  const chartData = useMemo(() => {
    return [...filteredWorkouts]
      .reverse()
      .map((w) => {
        const d = new Date(w.date);
        const label = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
        return {
          id: w.id,
          name: label,
          fullTitle: w.title,
          distance: w.distanceKm,
          calories: w.caloriesKcal,
          avgSpeed: w.avgSpeed,
          maxSpeed: w.maxSpeed,
          avgCadence: w.avgCadence,
          durationMins: Math.round(w.durationSeconds / 60)
        };
      });
  }, [filteredWorkouts]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!workouts.length) return;
    const headers = ['ID', 'Data', 'Titulo', 'Duracao_Segundos', 'Distancia_KM', 'Calorias_KCAL', 'Velocidade_Media_KMH', 'Velocidade_Max_KMH', 'Cadencia_Media_RPM', 'Resistencia'];
    const rows = workouts.map(w => [
      w.id,
      w.date,
      `"${(w.title || '').replace(/"/g, '""')}"`,
      w.durationSeconds,
      w.distanceKm,
      w.caloriesKcal,
      w.avgSpeed,
      w.maxSpeed,
      w.avgCadence,
      w.avgResistance || 12
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `merach_historico_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRowTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s > 0 ? `${s}s` : ''}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Period Filter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className={`w-3 h-8 rounded-full inline-block ${
              isRose 
                ? 'bg-gradient-to-b from-[#ff2d75] to-[#9400D3] shadow-[0_0_12px_rgba(255,45,117,0.6)]' 
                : 'bg-gradient-to-b from-sky-400 to-emerald-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]'
            }`} />
            Relatórios e Histórico de Treinos
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Acompanhamento dos teus registos oficiais da bicicleta Merach.
          </p>
        </div>

        {/* Period Selector & Export */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className={`flex items-center p-1 rounded-2xl border ${
            isRose ? 'bg-[#290534]/70 border-[#ff2d75]/30' : 'bg-slate-900/80 border-slate-800'
          }`}>
            {[
              { id: 'daily', label: 'Diário' },
              { id: 'weekly', label: 'Semanal' },
              { id: 'monthly', label: 'Mensal' },
              { id: 'all', label: 'Todos' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  period === p.id
                    ? isRose
                      ? 'bg-[#ff2d75]/25 text-[#ff85b3] border border-[#ff2d75]/40 shadow-sm'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isRose
                ? 'bg-[#380743] hover:bg-[#4d0a5e] border-[#ff2d75]/40 text-pink-200 hover:text-white'
                : 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/80 text-slate-300 hover:text-white'
            }`}
            title="Descarregar histórico em formato CSV"
          >
            <Download className={`w-3.5 h-3.5 ${isRose ? 'text-[#ff2d75]' : 'text-emerald-400'}`} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Statistical Summary Cards for Selected Period */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Total Workouts */}
        <div className={`rounded-2xl p-4 border flex flex-col justify-between ${
          isRose ? 'bg-[#290534]/70 border-[#ff2d75]/30' : 'glass-panel border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className={isRose ? 'text-pink-200' : 'text-slate-400'}>Total Treinos</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isRose ? 'bg-[#ff2d75]/20 text-[#ff85b3]' : 'bg-sky-500/10 text-sky-400'
            }`}>
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono text-white">
            {stats.totalCount}
          </div>
          <span className={`text-[10px] mt-1 ${isRose ? 'text-pink-300/70' : 'text-slate-500'}`}>Sessões realizadas</span>
        </div>

        {/* Total Time */}
        <div className={`rounded-2xl p-4 border flex flex-col justify-between ${
          isRose ? 'bg-[#290534]/70 border-[#ff2d75]/30' : 'glass-panel border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className={isRose ? 'text-pink-200' : 'text-slate-400'}>Tempo Total</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isRose ? 'bg-[#9400D3]/20 text-purple-300' : 'bg-indigo-500/10 text-indigo-400'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono" style={{ color: isRose ? '#ff85b3' : '#a5b4fc' }}>
            {stats.totalTimeFormatted}
          </div>
          <span className={`text-[10px] mt-1 ${isRose ? 'text-purple-300/70' : 'text-slate-500'}`}>Tempo acumulado</span>
        </div>

        {/* Total Distance */}
        <div className={`rounded-2xl p-4 border flex flex-col justify-between ${
          isRose ? 'bg-[#290534]/70 border-[#ff2d75]/30' : 'glass-panel border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className={isRose ? 'text-pink-200' : 'text-slate-400'}>Distância Total</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isRose ? 'bg-[#ff2d75]/20 text-[#ff2d75]' : 'bg-emerald-500/10 text-emerald-400'
            }`}>
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono" style={{ color: isRose ? '#ff2d75' : '#10b981' }}>
            {stats.totalDistance} <span className="text-xs font-sans font-medium text-slate-400">km</span>
          </div>
          <span className={`text-[10px] mt-1 ${isRose ? 'text-pink-300/70' : 'text-slate-500'}`}>Quilómetros percorridos</span>
        </div>

        {/* Total Calories */}
        <div className={`rounded-2xl p-4 border flex flex-col justify-between ${
          isRose ? 'bg-[#290534]/70 border-[#ff2d75]/30' : 'glass-panel border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span className={isRose ? 'text-pink-200' : 'text-slate-400'}>Calorias Totais</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isRose ? 'bg-[#9400D3]/25 text-[#9400D3]' : 'bg-amber-500/10 text-amber-400'
            }`}>
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black font-mono" style={{ color: isRose ? '#9400D3' : '#fbbf24' }}>
            {stats.totalCalories} <span className="text-xs font-sans font-medium text-slate-400">kcal</span>
          </div>
          <span className={`text-[10px] mt-1 ${isRose ? 'text-purple-300/70' : 'text-slate-500'}`}>Gasto calórico total</span>
        </div>
      </div>

      {/* Historical Performance Chart */}
      <div className={`rounded-3xl p-6 border ${
        isRose ? 'bg-[#24042e]/85 border-[#ff2d75]/35 shadow-xl' : 'glass-panel border-slate-800/80'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isRose ? 'bg-[#ff2d75]/20 border-[#ff2d75]/40 text-[#ff85b3]' : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
            }`}>
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Evolução Histórica das Sessões
              </h3>
              <p className={`text-xs ${isRose ? 'text-pink-200/80' : 'text-slate-400'}`}>
                Visualização do rendimento por sessão ({period === 'all' ? 'Todo o Histórico' : `Período ${period}`})
              </p>
            </div>
          </div>

          {/* Metric Selector for Chart */}
          <div className={`flex items-center gap-1.5 p-1 rounded-xl border ${
            isRose ? 'bg-[#31063d] border-[#ff2d75]/30' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <button
              onClick={() => setMetricTab('distance')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                metricTab === 'distance'
                  ? isRose
                    ? 'bg-[#ff2d75]/25 text-[#ff85b3] border border-[#ff2d75]/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Distância (km)
            </button>
            <button
              onClick={() => setMetricTab('calories')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                metricTab === 'calories'
                  ? isRose
                    ? 'bg-[#9400D3]/30 text-purple-200 border border-[#9400D3]/50'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Calorias (kcal)
            </button>
            <button
              onClick={() => setMetricTab('speed')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                metricTab === 'speed'
                  ? isRose
                    ? 'bg-[#ff2d75]/25 text-[#ff85b3] border border-[#ff2d75]/40'
                    : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Velocidade (km/h)
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="w-full h-72 md:h-80">
          {chartData.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2 border border-dashed border-slate-800 rounded-2xl">
              <BarChart3 className="w-6 h-6 text-slate-600" />
              <p className="text-xs">Não existem treinos registados neste período.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }} maxBarSize={48}>
                <CartesianGrid strokeDasharray="3 3" stroke={isRose ? '#4a0b5c' : '#1e293b'} opacity={0.5} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: isRose ? '#f472b6' : '#64748b', fontSize: 11 }} />

                {metricTab === 'distance' && (
                  <>
                    <YAxis stroke={isRose ? '#ff2d75' : '#10b981'} tick={{ fill: isRose ? '#ff2d75' : '#10b981', fontSize: 11 }} unit="km" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                              isRose ? 'bg-[#2e063b] border-[#ff2d75]/50' : 'glass-panel border-slate-700'
                            }`}>
                              <div className="font-bold text-white font-sans">{data.fullTitle} ({data.name})</div>
                              <div style={{ color: isRose ? '#ff2d75' : '#10b981' }}>Distância: {data.distance} km</div>
                              <div className="text-slate-400">Duração: {data.durationMins} min</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="distance" name="Distância (km)" fill={isRose ? '#ff2d75' : '#10b981'} radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </>
                )}

                {metricTab === 'calories' && (
                  <>
                    <YAxis stroke={isRose ? '#9400D3' : '#f59e0b'} tick={{ fill: isRose ? '#9400D3' : '#f59e0b', fontSize: 11 }} unit="kcal" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                              isRose ? 'bg-[#2e063b] border-[#ff2d75]/50' : 'glass-panel border-slate-700'
                            }`}>
                              <div className="font-bold text-white font-sans">{data.fullTitle} ({data.name})</div>
                              <div style={{ color: isRose ? '#9400D3' : '#f59e0b' }}>Calorias: {data.calories} kcal</div>
                              <div className="text-slate-400">Duração: {data.durationMins} min</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="calories" name="Energia (kcal)" fill={isRose ? '#9400D3' : '#f59e0b'} radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </>
                )}

                {metricTab === 'speed' && (
                  <>
                    <YAxis stroke={isRose ? '#ff2d75' : '#38bdf8'} tick={{ fill: isRose ? '#ff2d75' : '#38bdf8', fontSize: 11 }} unit="km/h" />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className={`p-3 rounded-xl border text-xs font-mono space-y-1 ${
                              isRose ? 'bg-[#2e063b] border-[#ff2d75]/50' : 'glass-panel border-slate-700'
                            }`}>
                              <div className="font-bold text-white font-sans">{data.fullTitle} ({data.name})</div>
                              <div style={{ color: isRose ? '#ff2d75' : '#38bdf8' }}>Velocidade Média: {data.avgSpeed} km/h</div>
                              <div style={{ color: isRose ? '#ff85b3' : '#06b6d4' }}>Velocidade Máxima: {data.maxSpeed} km/h</div>
                              <div style={{ color: isRose ? '#9400D3' : '#10b981' }}>Cadência: {data.avgCadence} RPM</div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="avgSpeed" name="Velocidade Média (km/h)" fill={isRose ? '#ff2d75' : '#38bdf8'} radius={[6, 6, 0, 0]} maxBarSize={36} />
                    <Bar dataKey="maxSpeed" name="Velocidade Máxima (km/h)" fill={isRose ? '#9400D3' : '#06b6d4'} radius={[6, 6, 0, 0]} opacity={0.8} maxBarSize={36} />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Detailed Workout History Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">
              Tabela de Histórico Detalhado
            </h3>
            <p className="text-xs text-slate-400">Lista completa das tuas sessões na bicicleta Merach</p>
          </div>

          {/* Search box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por título..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-semibold">Treino / Data</th>
                <th className="py-3 px-4 font-semibold">Duração</th>
                <th className="py-3 px-4 font-semibold">Velocidade Média</th>
                <th className="py-3 px-4 font-semibold">Cadência Média</th>
                <th className="py-3 px-4 font-semibold">Distância</th>
                <th className="py-3 px-4 font-semibold">Calorias</th>
                <th className="py-3 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredWorkouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Nenhum treino encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredWorkouts.map((workout) => {
                  const d = new Date(workout.date);
                  const dateStr = d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const timeStr = d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr
                      key={workout.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectWorkout(workout)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm group-hover:text-sky-300 transition-colors">
                          {workout.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {dateStr} às {timeStr}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-300">
                        {formatRowTime(workout.durationSeconds)}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-sky-400">{workout.avgSpeed} km/h</span>
                        <span className="text-[10px] text-slate-500 block">Pico: {workout.maxSpeed} km/h</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-emerald-400">{workout.avgCadence} RPM</span>
                        <span className="text-[10px] text-slate-500 block">Pico: {workout.maxCadence} RPM</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {workout.distanceKm} <span className="font-sans text-[10px] text-slate-400 font-normal">km</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {workout.caloriesKcal} <span className="font-sans text-[10px] text-slate-400 font-normal">kcal</span>
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectWorkout(workout)}
                            className="p-2 rounded-lg bg-slate-800/80 hover:bg-sky-500/20 text-slate-300 hover:text-sky-400 border border-slate-700/60 transition-colors cursor-pointer"
                            title="Ver Detalhes do Treino"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Eliminar "${workout.title}"?`)) {
                                onDeleteWorkout(workout.id);
                              }
                            }}
                            className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700/60 transition-colors cursor-pointer"
                            title="Apagar Treino"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
