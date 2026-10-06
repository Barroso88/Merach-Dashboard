import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Flame,
  Trash2,
  Eye,
  Download,
  BarChart3,
  Search,
  PlusCircle,
  Edit3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import WorkoutEditModal from './WorkoutEditModal';
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
  onSaveWorkout,
  themeConfig
}) {
  const isRose = themeConfig?.id === 'rose';
  const [period, setPeriod] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'all'
  const [searchTerm, setSearchTerm] = useState('');
  const [metricTab, setMetricTab] = useState('distance'); // 'distance', 'calories', 'speed'
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);

  // Selected month for calendar view (defaults to current month)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const changeMonth = (offset) => {
    setSelectedMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + offset, 1);
      return next;
    });
  };

  const isCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      selectedMonth.getFullYear() === now.getFullYear() &&
      selectedMonth.getMonth() === now.getMonth()
    );
  }, [selectedMonth]);

  const daysInMonth = useMemo(() => {
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [selectedMonth]);

  const monthName = useMemo(() => {
    const str = selectedMonth.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  }, [selectedMonth]);

  // Helper to parse workout date robustly
  const parseWorkoutDate = (dateVal) => {
    if (!dateVal) return null;
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const [y, m, d] = dateVal.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const dt = new Date(dateVal);
    if (isNaN(dt.getTime())) return null;
    return { year: dt.getFullYear(), month: dt.getMonth(), day: dt.getDate() };
  };

  // Filter workouts by selected period
  const filteredWorkouts = useMemo(() => {
    const now = new Date();
    const targetYear = selectedMonth.getFullYear();
    const targetMonth = selectedMonth.getMonth();

    return workouts.filter((w) => {
      const parsed = parseWorkoutDate(w.date);

      if (searchTerm) {
        const titleMatch = w.title?.toLowerCase().includes(searchTerm.toLowerCase());
        if (!titleMatch) return false;
      }

      if (period === 'all') return true;

      if (!parsed) return false;

      if (period === 'daily') {
        return (
          parsed.day === now.getDate() &&
          parsed.month === now.getMonth() &&
          parsed.year === now.getFullYear()
        );
      }

      if (period === 'weekly') {
        const workoutDate = new Date(w.date);
        const diffDays = (now - workoutDate) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }

      if (period === 'monthly') {
        return parsed.year === targetYear && parsed.month === targetMonth;
      }

      return true;
    });
  }, [workouts, period, searchTerm, selectedMonth]);

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

  // Chart data formatted into 28-31 daily calendar columns for the selected month
  const chartData = useMemo(() => {
    const targetYear = selectedMonth.getFullYear();
    const targetMonth = selectedMonth.getMonth();
    const today = new Date();
    const isThisMonth = today.getFullYear() === targetYear && today.getMonth() === targetMonth;
    const currentDayNum = today.getDate();

    const data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(targetYear, targetMonth, day);
      const weekdayShort = dayDate.toLocaleDateString('pt-PT', { weekday: 'short' }).replace('.', '');
      const fullDateStr = dayDate.toLocaleDateString('pt-PT', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      // Filter all workouts belonging to this exact calendar day
      const dayWorkouts = workouts.filter((w) => {
        const parsed = parseWorkoutDate(w.date);
        if (!parsed) return false;
        return parsed.year === targetYear && parsed.month === targetMonth && parsed.day === day;
      });

      const distance = Number(dayWorkouts.reduce((sum, w) => sum + (Number(w.distanceKm) || 0), 0).toFixed(2));
      const calories = Math.round(dayWorkouts.reduce((sum, w) => sum + (Number(w.caloriesKcal) || 0), 0));
      const durationSeconds = dayWorkouts.reduce((sum, w) => sum + (Number(w.durationSeconds) || 0), 0);
      const durationMins = Math.round(durationSeconds / 60);

      const avgSpeed = dayWorkouts.length > 0
        ? Number((dayWorkouts.reduce((sum, w) => sum + (Number(w.avgSpeed) || 0), 0) / dayWorkouts.length).toFixed(1))
        : 0;

      const maxSpeed = dayWorkouts.length > 0
        ? Math.max(...dayWorkouts.map((w) => Number(w.maxSpeed) || Number(w.avgSpeed) || 0))
        : 0;

      const avgCadence = dayWorkouts.length > 0
        ? Math.round(dayWorkouts.reduce((sum, w) => sum + (Number(w.avgCadence) || 0), 0) / dayWorkouts.length)
        : 0;

      data.push({
        day,
        name: `${day}`,
        fullDateStr,
        weekday: weekdayShort,
        distance,
        calories,
        avgSpeed,
        maxSpeed,
        avgCadence,
        durationMins,
        workoutCount: dayWorkouts.length,
        workouts: dayWorkouts,
        isToday: isThisMonth && day === currentDayNum,
        isFuture: isThisMonth && day > currentDayNum
      });
    }

    return data;
  }, [workouts, selectedMonth, daysInMonth]);

  // Monthly summary stats for the chart header
  const monthlyStats = useMemo(() => {
    const totalDistance = Number(chartData.reduce((sum, d) => sum + d.distance, 0).toFixed(1));
    const totalCalories = chartData.reduce((sum, d) => sum + d.calories, 0);
    const totalCount = chartData.reduce((sum, d) => sum + d.workoutCount, 0);
    const activeDays = chartData.filter(d => d.workoutCount > 0).length;
    return { totalDistance, totalCalories, totalCount, activeDays };
  }, [chartData]);

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
              { id: 'monthly', label: `Mensal (${monthName.split(' ')[0]})` },
              { id: 'all', label: 'Todos' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer capitalize ${
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

          <button
            type="button"
            onClick={() => {
              setEditingWorkout(null);
              setIsEditModalOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
              isRose
                ? 'bg-gradient-to-r from-[#9400D3] to-[#ff2d75] hover:opacity-90 text-white shadow-[#ff2d75]/20'
                : 'bg-gradient-to-r from-sky-500 to-emerald-500 hover:opacity-90 text-slate-950 font-black shadow-sky-500/20'
            }`}
            title="Registar manualmente um treino que não tenha ficado gravado"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Adicionar Treino</span>
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

      {/* Historical Performance Chart - 30/31 Day Calendar Grid */}
      <div className={`rounded-3xl p-6 border ${
        isRose ? 'bg-[#24042e]/85 border-[#ff2d75]/35 shadow-xl' : 'glass-panel border-slate-800/80'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-5">
          {/* Title & Stats Subtitle */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
              isRose ? 'bg-[#ff2d75]/20 border-[#ff2d75]/40 text-[#ff85b3]' : 'bg-sky-500/15 border-sky-500/30 text-sky-400'
            }`}>
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Evolução Mensal ({daysInMonth} Dias)
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  monthlyStats.totalCount > 0
                    ? isRose ? 'bg-[#ff2d75]/20 border-[#ff2d75]/40 text-pink-200' : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}>
                  {monthlyStats.activeDays} {monthlyStats.activeDays === 1 ? 'dia ativo' : 'dias ativos'}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isRose ? 'text-pink-200/80' : 'text-slate-400'}`}>
                {monthName}: <strong className="text-white">{monthlyStats.totalCount} treinos</strong> ({monthlyStats.totalDistance} km • {monthlyStats.totalCalories} kcal)
              </p>
            </div>
          </div>

          {/* Controls: Month Navigator & Metric Tabs */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
            {/* Month Navigator */}
            <div className="flex items-center gap-1.5">
              <div className={`flex items-center p-1 rounded-xl border ${
                isRose ? 'bg-[#31063d] border-[#ff2d75]/30' : 'bg-slate-900/90 border-slate-800'
              }`}>
                <button
                  type="button"
                  onClick={() => changeMonth(-1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-xs font-bold text-white px-2 min-w-[110px] text-center capitalize select-none">
                  {monthName}
                </span>

                <button
                  type="button"
                  onClick={() => changeMonth(1)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Mês seguinte"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {!isCurrentMonth && (
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setSelectedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  }}
                  className={`px-2.5 py-1 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    isRose
                      ? 'bg-[#ff2d75]/20 border-[#ff2d75]/40 text-pink-200 hover:bg-[#ff2d75]/30'
                      : 'bg-sky-500/20 border-sky-500/40 text-sky-300 hover:bg-sky-500/30'
                  }`}
                  title="Voltar ao mês atual"
                >
                  Hoje
                </button>
              )}
            </div>

            {/* Metric Selector for Chart */}
            <div className={`flex items-center gap-1 p-1 rounded-xl border ${
              isRose ? 'bg-[#31063d] border-[#ff2d75]/30' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => setMetricTab('distance')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  metricTab === 'distance'
                    ? isRose
                      ? 'bg-[#ff2d75]/25 text-[#ff85b3] border border-[#ff2d75]/40'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Distância
              </button>
              <button
                type="button"
                onClick={() => setMetricTab('calories')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  metricTab === 'calories'
                    ? isRose
                      ? 'bg-[#9400D3]/30 text-purple-200 border border-[#9400D3]/50'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Calorias
              </button>
              <button
                type="button"
                onClick={() => setMetricTab('speed')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  metricTab === 'speed'
                    ? isRose
                      ? 'bg-[#ff2d75]/25 text-[#ff85b3] border border-[#ff2d75]/40'
                      : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Velocidade
              </button>
            </div>
          </div>
        </div>

        {/* Chart Canvas with 28-31 Columns and subtle slots */}
        <div className="w-full h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 10, left: -15, bottom: 0 }}
              barCategoryGap="12%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isRose ? '#4a0b5c' : '#1e293b'}
                opacity={0.35}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tickLine={false}
                axisLine={{ stroke: isRose ? '#4a0b5c' : '#1e293b' }}
                tick={{ fill: isRose ? '#f472b6' : '#94a3b8', fontSize: 10, fontWeight: 500 }}
                interval="preserveStartEnd"
              />

              {metricTab === 'distance' && (
                <>
                  <YAxis
                    stroke={isRose ? '#ff2d75' : '#10b981'}
                    tick={{ fill: isRose ? '#ff2d75' : '#10b981', fontSize: 10 }}
                    unit="km"
                    allowDecimals={true}
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    cursor={{ fill: isRose ? 'rgba(255, 45, 117, 0.12)' : 'rgba(56, 189, 248, 0.1)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 shadow-2xl backdrop-blur-md ${
                            isRose ? 'bg-[#290534]/95 border-[#ff2d75]/50' : 'bg-slate-900/95 border-slate-700/80'
                          }`}>
                            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5 font-sans">
                              <span className="font-bold text-white">Dia {data.day} ({data.weekday})</span>
                              {data.workoutCount > 0 ? (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  isRose ? 'bg-[#ff2d75]/30 text-pink-200 border border-[#ff2d75]/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}>
                                  {data.workoutCount} {data.workoutCount === 1 ? 'treino' : 'treinos'}
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400">
                                  Descanso
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 capitalize">{data.fullDateStr}</div>
                            {data.workoutCount > 0 ? (
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between gap-4 font-bold" style={{ color: isRose ? '#ff2d75' : '#10b981' }}>
                                  <span>Distância:</span>
                                  <span>{data.distance} km</span>
                                </div>
                                <div className="flex justify-between gap-4" style={{ color: isRose ? '#9400D3' : '#f59e0b' }}>
                                  <span>Calorias:</span>
                                  <span>{data.calories} kcal</span>
                                </div>
                                <div className="flex justify-between gap-4 text-slate-300">
                                  <span>Duração:</span>
                                  <span>{data.durationMins} min</span>
                                </div>
                                {data.avgSpeed > 0 && (
                                  <div className="flex justify-between gap-4" style={{ color: isRose ? '#ff85b3' : '#38bdf8' }}>
                                    <span>Vel. Média:</span>
                                    <span>{data.avgSpeed} km/h</span>
                                  </div>
                                )}
                                {data.workouts && data.workouts.length > 0 && (
                                  <div className="pt-1.5 border-t border-white/10 text-[10px] text-slate-400 font-sans space-y-0.5">
                                    {data.workouts.map((w, idx) => (
                                      <div key={idx} className="truncate max-w-[220px]">
                                        • {w.title || 'Treino'} ({Math.round((w.durationSeconds || 0) / 60)}m, {w.distanceKm}km)
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-slate-500 italic text-[11px] pt-0.5">
                                Sem treinos registados neste dia.
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="distance"
                    name="Distância (km)"
                    fill={isRose ? '#ff2d75' : '#10b981'}
                    radius={[3, 3, 0, 0]}
                    background={{
                      fill: isRose ? 'rgba(255, 45, 117, 0.08)' : 'rgba(56, 189, 248, 0.06)',
                      radius: [3, 3, 0, 0]
                    }}
                  />
                </>
              )}

              {metricTab === 'calories' && (
                <>
                  <YAxis
                    stroke={isRose ? '#9400D3' : '#f59e0b'}
                    tick={{ fill: isRose ? '#9400D3' : '#f59e0b', fontSize: 10 }}
                    unit="kcal"
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    cursor={{ fill: isRose ? 'rgba(148, 0, 211, 0.12)' : 'rgba(245, 158, 11, 0.1)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 shadow-2xl backdrop-blur-md ${
                            isRose ? 'bg-[#290534]/95 border-[#ff2d75]/50' : 'bg-slate-900/95 border-slate-700/80'
                          }`}>
                            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5 font-sans">
                              <span className="font-bold text-white">Dia {data.day} ({data.weekday})</span>
                              {data.workoutCount > 0 ? (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  isRose ? 'bg-[#9400D3]/30 text-purple-200 border border-[#9400D3]/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}>
                                  {data.workoutCount} {data.workoutCount === 1 ? 'treino' : 'treinos'}
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400">
                                  Descanso
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 capitalize">{data.fullDateStr}</div>
                            {data.workoutCount > 0 ? (
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between gap-4 font-bold" style={{ color: isRose ? '#9400D3' : '#f59e0b' }}>
                                  <span>Calorias:</span>
                                  <span>{data.calories} kcal</span>
                                </div>
                                <div className="flex justify-between gap-4" style={{ color: isRose ? '#ff2d75' : '#10b981' }}>
                                  <span>Distância:</span>
                                  <span>{data.distance} km</span>
                                </div>
                                <div className="flex justify-between gap-4 text-slate-300">
                                  <span>Duração:</span>
                                  <span>{data.durationMins} min</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-500 italic text-[11px] pt-0.5">
                                Sem treinos registados neste dia.
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="calories"
                    name="Energia (kcal)"
                    fill={isRose ? '#9400D3' : '#f59e0b'}
                    radius={[3, 3, 0, 0]}
                    background={{
                      fill: isRose ? 'rgba(148, 0, 211, 0.08)' : 'rgba(245, 158, 11, 0.06)',
                      radius: [3, 3, 0, 0]
                    }}
                  />
                </>
              )}

              {metricTab === 'speed' && (
                <>
                  <YAxis
                    stroke={isRose ? '#ff2d75' : '#38bdf8'}
                    tick={{ fill: isRose ? '#ff2d75' : '#38bdf8', fontSize: 10 }}
                    unit="km/h"
                    domain={[0, 'auto']}
                  />
                  <Tooltip
                    cursor={{ fill: isRose ? 'rgba(255, 45, 117, 0.12)' : 'rgba(56, 189, 248, 0.1)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={`p-3 rounded-xl border text-xs font-mono space-y-1.5 shadow-2xl backdrop-blur-md ${
                            isRose ? 'bg-[#290534]/95 border-[#ff2d75]/50' : 'bg-slate-900/95 border-slate-700/80'
                          }`}>
                            <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5 font-sans">
                              <span className="font-bold text-white">Dia {data.day} ({data.weekday})</span>
                              {data.workoutCount > 0 ? (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  isRose ? 'bg-[#ff2d75]/30 text-pink-200 border border-[#ff2d75]/40' : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                                }`}>
                                  {data.workoutCount} {data.workoutCount === 1 ? 'treino' : 'treinos'}
                                </span>
                              ) : (
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400">
                                  Descanso
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 capitalize">{data.fullDateStr}</div>
                            {data.workoutCount > 0 ? (
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between gap-4 font-bold" style={{ color: isRose ? '#ff2d75' : '#38bdf8' }}>
                                  <span>Vel. Média:</span>
                                  <span>{data.avgSpeed} km/h</span>
                                </div>
                                <div className="flex justify-between gap-4" style={{ color: isRose ? '#ff85b3' : '#06b6d4' }}>
                                  <span>Vel. Máxima:</span>
                                  <span>{data.maxSpeed} km/h</span>
                                </div>
                                <div className="flex justify-between gap-4" style={{ color: isRose ? '#9400D3' : '#10b981' }}>
                                  <span>Cadência:</span>
                                  <span>{data.avgCadence} RPM</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-500 italic text-[11px] pt-0.5">
                                Sem treinos registados neste dia.
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="avgSpeed"
                    name="Vel. Média (km/h)"
                    fill={isRose ? '#ff2d75' : '#38bdf8'}
                    radius={[3, 3, 0, 0]}
                    background={{
                      fill: isRose ? 'rgba(255, 45, 117, 0.06)' : 'rgba(56, 189, 248, 0.05)',
                      radius: [3, 3, 0, 0]
                    }}
                  />
                  <Bar
                    dataKey="maxSpeed"
                    name="Vel. Máxima (km/h)"
                    fill={isRose ? '#9400D3' : '#06b6d4'}
                    radius={[3, 3, 0, 0]}
                    opacity={0.85}
                    background={{
                      fill: isRose ? 'rgba(148, 0, 211, 0.06)' : 'rgba(6, 182, 212, 0.05)',
                      radius: [3, 3, 0, 0]
                    }}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Calendar Month Quick Highlights Footer */}
        <div className={`mt-4 pt-3.5 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
          isRose ? 'border-[#ff2d75]/20 text-pink-200/70' : 'border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-500">Dias com Treino: </span>
              <strong className="text-white font-mono">{monthlyStats.activeDays}</strong> de {daysInMonth} dias ({Math.round((monthlyStats.activeDays / daysInMonth) * 100)}%)
            </div>
            <div>
              <span className="text-slate-500">Média por Sessão: </span>
              <strong className="text-white font-mono">
                {monthlyStats.totalCount > 0 ? (monthlyStats.totalDistance / monthlyStats.totalCount).toFixed(1) : 0} km
              </strong>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Cada coluna representa 1 dia do mês • Colunas vazias indicam dias de descanso
          </div>
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
                              setEditingWorkout(workout);
                              setIsEditModalOpen(true);
                            }}
                            className="p-2 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-700/60 transition-colors cursor-pointer"
                            title="Editar Dados deste Treino"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
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

      {/* Modal para Adicionar / Editar Treino */}
      <WorkoutEditModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingWorkout(null);
        }}
        workout={editingWorkout}
        onSave={(savedWorkout) => {
          if (onSaveWorkout) onSaveWorkout(savedWorkout);
          setIsEditModalOpen(false);
          setEditingWorkout(null);
        }}
        themeConfig={themeConfig}
      />
    </div>
  );
}
