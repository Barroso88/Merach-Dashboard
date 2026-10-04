import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Flag,
  Navigation,
  ArrowDownUp,
  Search,
  Loader2,
  Mountain,
  Gauge,
  Sparkles,
  Check,
  Bike
} from 'lucide-react';
import { searchPlaces, calculateRoute, saveCustomRoute } from '../services/routePlannerService';

const POPULAR_STARTS = [
  { name: 'Belém (Lisboa)', description: 'Torre de Belém, Lisboa', lat: 38.6916, lng: -9.2160 },
  { name: 'Aliados (Porto)', description: 'Avenida dos Aliados, Porto', lat: 41.1496, lng: -8.6109 },
  { name: 'Cascais Marina', description: 'Marina de Cascais', lat: 38.6922, lng: -9.4187 },
  { name: 'Sintra Vila', description: 'Palácio Nacional de Sintra', lat: 38.7977, lng: -9.3906 },
  { name: 'Coimbra Rio', description: 'Parque Verde do Mondego', lat: 40.2036, lng: -8.4287 }
];

const POPULAR_ENDS = [
  { name: 'Praia do Guincho', description: 'Estrada do Guincho, Cascais', lat: 38.7323, lng: -9.4735 },
  { name: 'Foz do Douro', description: 'Farol das Felgueiras, Porto', lat: 41.1478, lng: -8.6750 },
  { name: 'Cabo da Roca', description: 'Ponto Mais Ocidental da Europa', lat: 38.7804, lng: -9.4989 },
  { name: 'Monsanto Miradouro', description: 'Parque Florestal de Monsanto', lat: 38.7291, lng: -9.1866 },
  { name: 'Nazaré Farol', description: 'Forte de São Miguel Arcanjo', lat: 39.6053, lng: -9.0768 }
];

export default function RoutePlannerModal({
  isOpen,
  onClose,
  onRouteCreated,
  isRose = false,
  primaryColor = '#38bdf8'
}) {
  const [startQuery, setStartQuery] = useState('');
  const [startPoint, setStartPoint] = useState(null);
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [isSearchingStart, setIsSearchingStart] = useState(false);

  const [endQuery, setEndQuery] = useState('');
  const [endPoint, setEndPoint] = useState(null);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [isSearchingEnd, setIsSearchingEnd] = useState(false);

  const [customName, setCustomName] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [previewRoute, setPreviewRoute] = useState(null);
  const [error, setError] = useState(null);

  // Debounce search for Start Point
  useEffect(() => {
    if (!startQuery || startPoint?.name === startQuery) {
      setStartSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingStart(true);
      try {
        const results = await searchPlaces(startQuery);
        setStartSuggestions(results);
      } finally {
        setIsSearchingStart(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [startQuery, startPoint]);

  // Debounce search for End Point
  useEffect(() => {
    if (!endQuery || endPoint?.name === endQuery) {
      setEndSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingEnd(true);
      try {
        const results = await searchPlaces(endQuery);
        setEndSuggestions(results);
      } finally {
        setIsSearchingEnd(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [endQuery, endPoint]);

  // Auto calculate preview when both points are selected
  useEffect(() => {
    if (!startPoint || !endPoint) {
      setPreviewRoute(null);
      return;
    }

    let isCancelled = false;
    const fetchPreview = async () => {
      setIsCalculating(true);
      setError(null);
      try {
        const route = await calculateRoute(startPoint, endPoint, customName);
        if (!isCancelled) {
          setPreviewRoute(route);
          if (!customName) {
            setCustomName(`${startPoint.name} ➔ ${endPoint.name}`);
          }
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Erro ao calcular rota entre os pontos.');
        }
      } finally {
        if (!isCancelled) setIsCalculating(false);
      }
    };

    fetchPreview();
    return () => { isCancelled = true; };
  }, [startPoint, endPoint]);

  if (!isOpen) return null;

  const handleSwap = () => {
    const tempPoint = startPoint;
    const tempQuery = startQuery;
    setStartPoint(endPoint);
    setStartQuery(endPoint ? endPoint.name : '');
    setEndPoint(tempPoint);
    setEndQuery(tempPoint ? tempPoint.name : '');
    if (tempPoint && endPoint) {
      setCustomName(`${endPoint.name} ➔ ${tempPoint.name}`);
    }
  };

  const handleCreateRoute = () => {
    if (!previewRoute) return;
    const finalRoute = {
      ...previewRoute,
      name: customName.trim() || previewRoute.name
    };
    saveCustomRoute(finalRoute);
    onRouteCreated(finalRoute);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl border shadow-2xl p-6 transition-all ${
        isRose
          ? 'bg-[#180320]/95 border-[#ff2d75]/40 shadow-[0_0_50px_rgba(255,45,117,0.25)]'
          : 'bg-slate-950/95 border-sky-500/40 shadow-[0_0_50px_rgba(56,189,248,0.25)]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
              isRose ? 'bg-[#ff2d75]/20 text-[#ff2d75] border border-[#ff2d75]/30' : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
            }`}>
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-white font-black text-lg">Criar Percurso Personalizado</h3>
              <p className="text-slate-400 text-xs">Define a partida e chegada. O sistema traça a estrada e curvas reais.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs Container */}
        <div className="space-y-4">
          {/* 1. START POINT INPUT */}
          <div className="relative">
            <label className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5" />
              <span>Ponto de Partida 🚦</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={startQuery}
                onChange={(e) => {
                  setStartQuery(e.target.value);
                  if (startPoint) setStartPoint(null);
                }}
                placeholder="Ex: Torre de Belém, Lisboa ou Av. dos Aliados..."
                className="w-full px-4 py-3 pl-10 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-400 transition-all font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              {isSearchingStart && (
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin absolute right-3.5 top-3.5" />
              )}
            </div>

            {/* Suggestions dropdown */}
            {startSuggestions.length > 0 && !startPoint && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-white/5 max-h-52 overflow-y-auto">
                {startSuggestions.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setStartPoint(item);
                      setStartQuery(item.name);
                      setStartSuggestions([]);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-emerald-500/20 transition-all flex flex-col cursor-pointer"
                  >
                    <span className="text-white text-xs font-bold">{item.name}</span>
                    <span className="text-slate-400 text-[10px] truncate">{item.description}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Presets for Start */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 self-center mr-1">Sugestões:</span>
              {POPULAR_STARTS.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setStartPoint(p);
                    setStartQuery(p.name);
                    setStartSuggestions([]);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                    startPoint?.name === p.name
                      ? 'bg-emerald-500/30 border-emerald-400 text-emerald-300 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={handleSwap}
              disabled={!startPoint && !endPoint}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-md flex items-center gap-1.5 text-xs font-bold"
              title="Trocar Partida e Chegada"
            >
              <ArrowDownUp className="w-3.5 h-3.5 text-sky-400" />
              <span>Inverter Sentido</span>
            </button>
          </div>

          {/* 2. END POINT INPUT */}
          <div className="relative">
            <label className="flex items-center gap-2 text-xs font-bold text-rose-400 mb-1.5 uppercase tracking-wider">
              <Flag className="w-3.5 h-3.5" />
              <span>Ponto de Chegada 🏁</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={endQuery}
                onChange={(e) => {
                  setEndQuery(e.target.value);
                  if (endPoint) setEndPoint(null);
                }}
                placeholder="Ex: Praia do Guincho, Foz do Douro, Cabo da Roca..."
                className="w-full px-4 py-3 pl-10 rounded-2xl bg-white/5 border border-white/15 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-rose-400 transition-all font-medium"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              {isSearchingEnd && (
                <Loader2 className="w-4 h-4 text-rose-400 animate-spin absolute right-3.5 top-3.5" />
              )}
            </div>

            {/* Suggestions dropdown */}
            {endSuggestions.length > 0 && !endPoint && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-slate-900 border border-white/20 rounded-2xl shadow-2xl z-30 overflow-hidden divide-y divide-white/5 max-h-52 overflow-y-auto">
                {endSuggestions.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setEndPoint(item);
                      setEndQuery(item.name);
                      setEndSuggestions([]);
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-rose-500/20 transition-all flex flex-col cursor-pointer"
                  >
                    <span className="text-white text-xs font-bold">{item.name}</span>
                    <span className="text-slate-400 text-[10px] truncate">{item.description}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick Presets for End */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 self-center mr-1">Sugestões:</span>
              {POPULAR_ENDS.map(p => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    setEndPoint(p);
                    setEndQuery(p.name);
                    setEndSuggestions([]);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                    endPoint?.name === p.name
                      ? 'bg-rose-500/30 border-rose-400 text-rose-300 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. CUSTOM ROUTE NAME (Optional) */}
          {startPoint && endPoint && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Nome do Percurso
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ex: Treino Costeiro Cascais - Guincho"
                className="w-full px-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:border-sky-400 font-bold"
              />
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs text-center font-medium">
            {error}
          </div>
        )}

        {/* Route Preview Card */}
        {isCalculating && (
          <div className="mt-5 p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-slate-300 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
            <span>A traçar percurso pelas estradas e ciclovias reais...</span>
          </div>
        )}

        {previewRoute && !isCalculating && (
          <div className={`mt-5 p-4 rounded-2xl border backdrop-blur-xl transition-all ${
            isRose ? 'bg-[#ff2d75]/10 border-[#ff2d75]/30' : 'bg-sky-500/10 border-sky-400/30'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                <Bike className="w-4 h-4 text-sky-400" />
                <span>Resumo da Rota Traçada</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-emerald-300 border border-white/15">
                {previewRoute.difficulty}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">Distância</span>
                <span className="text-base font-black text-white">{previewRoute.distanceKm} <span className="text-[10px] text-slate-400">km</span></span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">Subida (D+)</span>
                <span className="text-base font-black text-white">+{previewRoute.elevationGain} <span className="text-[10px] text-slate-400">m</span></span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10">
                <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">Tempo Est. (25 km/h)</span>
                <span className="text-base font-black text-white">
                  ~{Math.round((previewRoute.distanceKm / 25) * 60)} <span className="text-[10px] text-slate-400">min</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleCreateRoute}
            disabled={!previewRoute || isCalculating}
            className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shadow-xl disabled:opacity-40 disabled:cursor-not-allowed ${
              isRose
                ? 'bg-gradient-to-r from-[#9400D3] to-[#ff2d75] text-white hover:shadow-[#ff2d75]/40'
                : 'bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 hover:shadow-sky-500/40'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Pedalar Neste Percurso Agora</span>
          </button>
        </div>
      </div>
    </div>
  );
}
