import React, { useState, useEffect } from 'react';
import {
  X,
  Radio,
  Server,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Save,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Database
} from 'lucide-react';
import { DEFAULT_SETTINGS } from '../services/storageService';

export default function ConnectionSettingsModal({
  isOpen,
  onClose,
  settings,
  themeConfig,
  onSave,
  onSaveSettings,
  haService,
  onResetSampleData
}) {
  const isRose = themeConfig?.id === 'rose';

  const [formData, setFormData] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...settings,
    haEntities: {
      ...(DEFAULT_SETTINGS.haEntities || {}),
      ...(settings?.haEntities || {})
    },
    postgresConfig: {
      host: '',
      port: 5432,
      user: 'postgres',
      password: '',
      database: 'merach',
      ...(DEFAULT_SETTINGS.postgresConfig || {}),
      ...(settings?.postgresConfig || {})
    }
  }));
  const [testingStatus, setTestingStatus] = useState(null);
  const [discoveringStatus, setDiscoveringStatus] = useState(null);
  const [postgresTestStatus, setPostgresTestStatus] = useState(null);
  const [detectedSensors, setDetectedSensors] = useState([]);
  const [sensorFilter, setSensorFilter] = useState('merach');
  const [showCorsHelp, setShowCorsHelp] = useState(false);
  const [showCfTokens, setShowCfTokens] = useState(Boolean(settings?.cfClientId));
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever modal is opened or settings change
  useEffect(() => {
    if (isOpen && settings) {
      setFormData({
        ...DEFAULT_SETTINGS,
        ...settings,
        haEntities: {
          ...(DEFAULT_SETTINGS.haEntities || {}),
          ...(settings.haEntities || {})
        },
        postgresConfig: {
          host: '',
          port: 5432,
          user: 'postgres',
          password: '',
          database: 'merach',
          ...(DEFAULT_SETTINGS.postgresConfig || {}),
          ...(settings.postgresConfig || {})
        }
      });
      setTestingStatus(null);
      setDiscoveringStatus(null);
      setPostgresTestStatus(null);
      setSaveSuccess(false);
    }
  }, [isOpen, settings]);

  const handleTestConnection = async () => {
    setTestingStatus({ loading: true, message: 'A testar conexão ao Home Assistant...' });
    haService.updateConfig({
      haUrl: formData.haUrl,
      haToken: formData.haToken,
      cfClientId: formData.cfClientId,
      cfClientSecret: formData.cfClientSecret,
      haEntities: formData.haEntities
    });

    const result = await haService.testConnection();
    setTestingStatus({
      loading: false,
      success: result.success,
      isCors: result.isCors,
      isCloudflarePolicy: result.isCloudflarePolicy,
      message: result.message
    });
    if (result.isCors || result.isCloudflarePolicy) {
      setShowCorsHelp(true);
      if (result.isCloudflarePolicy) {
        setShowCfTokens(true);
      }
    }
  };

  const handleDiscoverSensors = async () => {
    setDiscoveringStatus({ loading: true, message: 'A filtrar sensores específicos da Merach...' });
    haService.updateConfig({
      haUrl: formData.haUrl,
      haToken: formData.haToken,
      cfClientId: formData.cfClientId,
      cfClientSecret: formData.cfClientSecret
    });

    try {
      const res = await haService.discoverEntities();
      setDetectedSensors(res.candidates || []);
      
      // Auto-assign strictly Merach entities, clearing any unrelated general home sensors
      const updatedEntities = {
        cadence: res.suggestions?.cadence || '',
        speed: res.suggestions?.speed || '',
        power: res.suggestions?.power || '',
        resistance: res.suggestions?.resistance || '',
        heartRate: res.suggestions?.heartRate || '',
        distance: res.suggestions?.distance || '',
        calories: res.suggestions?.calories || ''
      };

      setFormData((prev) => ({
        ...prev,
        mode: 'homeassistant',
        haEntities: updatedEntities
      }));

      setDiscoveringStatus({
        loading: false,
        success: true,
        message: `Detetados ${res.candidates.length} sensores Merach! Modo Home Assistant ativado.`
      });
    } catch (err) {
      setDiscoveringStatus({
        loading: false,
        success: false,
        message: err.message
      });
    }
  };

  const handleClearAllSensors = () => {
    setFormData((prev) => ({
      ...prev,
      haEntities: {
        cadence: '',
        speed: '',
        power: '',
        resistance: '',
        heartRate: '',
        distance: '',
        calories: ''
      }
    }));
  };

  const assignSensor = (key, entityId) => {
    setFormData((prev) => ({
      ...prev,
      mode: 'homeassistant',
      haEntities: {
        ...prev.haEntities,
        [key]: entityId
      }
    }));
  };

  const handleTestPostgresConnection = async () => {
    setPostgresTestStatus({ loading: true, message: 'A testar ligação ao PostgreSQL no Unraid...' });
    try {
      const res = await fetch('/api/postgres/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData.postgresConfig || {})
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPostgresTestStatus({
          loading: false,
          success: true,
          message: data.message || 'Ligação ao PostgreSQL estabelecida com sucesso!'
        });
      } else {
        setPostgresTestStatus({
          loading: false,
          success: false,
          message: data.error || 'Falha ao ligar ao PostgreSQL. Verifique os dados de acesso.'
        });
      }
    } catch (err) {
      setPostgresTestStatus({
        loading: false,
        success: false,
        message: `Erro ao contactar o servidor: ${err.message}`
      });
    }
  };

  const handleSave = () => {
    const saveHandler = onSaveSettings || onSave;
    if (typeof saveHandler === 'function') {
      saveHandler(formData);
    }
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 350);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col backdrop-blur-2xl transition-all duration-500 border ${
        themeConfig?.modalPanelClass || 'bg-slate-950/90 border-slate-700/80 shadow-2xl'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm ${
              isRose 
                ? 'bg-[#ff2d75]/20 border-[#ff2d75]/40 text-[#ff85b3]' 
                : 'bg-sky-500/20 border-sky-500/30 text-sky-400'
            }`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white">Configuração da Bicicleta & Sensores</h2>
              <p className={`text-xs ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>
                Alternar entre Modo Simulação e Integração com Home Assistant
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isRose 
                ? 'bg-[#380743] hover:bg-[#4d0a5e] text-pink-200 hover:text-white border border-[#ff2d75]/30' 
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="overflow-y-auto space-y-6 py-5 flex-1 pr-1 text-xs">
          {/* Mode Switcher */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isRose ? 'text-pink-200' : 'text-slate-300'}`}>
              Modo de Operação dos Sensores
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'simulation' })}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.mode === 'simulation'
                    ? isRose
                      ? 'bg-[#3a0746] border-[#ff2d75] text-white shadow-[0_0_20px_-3px_rgba(255,45,117,0.4)]'
                      : 'bg-sky-500/15 border-sky-400 text-white shadow-[0_0_20px_-5px_rgba(56,189,248,0.3)]'
                    : isRose
                      ? 'bg-[#290534]/50 border-[#ff2d75]/25 text-slate-400 hover:border-[#ff2d75]/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Cpu className={`w-4 h-4 ${formData.mode === 'simulation' ? (isRose ? 'text-[#ff2d75]' : 'text-sky-400') : 'text-slate-500'}`} />
                  <span className="font-bold text-sm text-white">Modo Simulação (Ativo)</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isRose ? 'text-pink-300/80' : 'text-slate-400'}`}>
                  Gera telemetria realista com os ponteiros de velocidade e cadência a moverem-se em tempo real.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, mode: 'homeassistant' })}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.mode === 'homeassistant'
                    ? isRose
                      ? 'bg-[#3a0746] border-[#9400D3] text-white shadow-[0_0_20px_-3px_rgba(148,0,211,0.5)]'
                      : 'bg-emerald-500/15 border-emerald-400 text-white shadow-[0_0_20px_-5px_rgba(52,211,153,0.3)]'
                    : isRose
                      ? 'bg-[#290534]/50 border-[#ff2d75]/25 text-slate-400 hover:border-[#ff2d75]/50'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Radio className={`w-4 h-4 ${formData.mode === 'homeassistant' ? (isRose ? 'text-[#9400D3]' : 'text-emerald-400') : 'text-slate-500'}`} />
                  <span className="font-bold text-sm text-white">Modo Home Assistant (API Real)</span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isRose ? 'text-purple-300/80' : 'text-slate-400'}`}>
                  Lê os sensores físicos da bicicleta Merach configurados no Home Assistant via REST API.
                </p>
              </button>
            </div>
          </div>

          {/* Home Assistant Settings */}
          <div className={`p-4 rounded-2xl border space-y-4 ${
            isRose ? 'bg-[#330742]/80 border-[#ff2d75]/40 shadow-inner' : 'bg-slate-950/60 border-slate-800/80'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isRose ? 'text-[#ff85b3]' : 'text-slate-300'
            }`}>
              <Server className={`w-4 h-4 ${isRose ? 'text-[#ff2d75]' : 'text-emerald-400'}`} />
              Parâmetros de Ligação ao Home Assistant
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`block font-semibold ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>
                    URL do Home Assistant
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, haUrl: 'https://ha.barrosoportal.com' })}
                      className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        formData.haUrl?.includes('ha.barrosoportal.com')
                          ? isRose ? 'bg-[#ff2d75]/30 border-[#ff2d75] text-white' : 'bg-sky-500/25 border-sky-400 text-sky-200'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Usar túnel Cloudflare"
                    >
                      ha.barrosoportal.com
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, haUrl: 'http://homeassistant.local:8123' })}
                      className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        formData.haUrl?.includes(':8123')
                          ? isRose ? 'bg-[#ff2d75]/30 border-[#ff2d75] text-white' : 'bg-sky-500/25 border-sky-400 text-sky-200'
                          : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Usar endereço local"
                    >
                      Local :8123
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  value={formData.haUrl}
                  onChange={(e) => setFormData({ ...formData, haUrl: e.target.value })}
                  placeholder="https://ha.barrosoportal.com"
                  className={`w-full rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-colors border ${
                    themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 focus:border-sky-500'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>
                  Token de Longa Duração (Bearer)
                </label>
                <div className="relative">
                  <Key className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${isRose ? 'text-pink-400' : 'text-slate-500'}`} />
                  <input
                    type="password"
                    value={formData.haToken}
                    onChange={(e) => setFormData({ ...formData, haToken: e.target.value })}
                    placeholder="eyJhbGciOi..."
                    className={`w-full rounded-xl pl-8 pr-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-colors font-mono border ${
                      themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 focus:border-sky-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Optional Cloudflare Access Service Token Inputs */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => setShowCfTokens(!showCfTokens)}
                className={`text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isRose ? 'text-purple-300 hover:text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Autenticação Cloudflare Access (Zero Trust) {formData.cfClientId ? '✓ Ativo' : '(Opcional)'}</span>
                {showCfTokens ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showCfTokens && (
                <div className={`mt-2 p-3 rounded-2xl border space-y-2.5 animate-fadeIn ${
                  isRose ? 'bg-[#290534] border-[#9400D3]/40' : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <p className="text-[10px] text-slate-300 leading-relaxed">
                    Se o túnel <code>ha.barrosoportal.com</code> estiver protegido por regras do Cloudflare Access, insira aqui o Service Token (ou crie uma regra de Bypass para <code>/api/*</code> no painel da Cloudflare):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">CF-Access-Client-Id:</label>
                      <input
                        type="text"
                        value={formData.cfClientId || ''}
                        onChange={(e) => setFormData({ ...formData, cfClientId: e.target.value })}
                        placeholder="xxxxxxxx.access"
                        className={`w-full rounded-lg px-2.5 py-1.5 font-mono text-[11px] border ${
                          themeConfig?.modalInputClass || 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">CF-Access-Client-Secret:</label>
                      <input
                        type="password"
                        value={formData.cfClientSecret || ''}
                        onChange={(e) => setFormData({ ...formData, cfClientSecret: e.target.value })}
                        placeholder="••••••••••••••••"
                        className={`w-full rounded-lg px-2.5 py-1.5 font-mono text-[11px] border ${
                          themeConfig?.modalInputClass || 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Entity IDs (Cadence & Speed) */}
            <div className={`space-y-3 pt-2 border-t ${isRose ? 'border-[#ff2d75]/30' : 'border-slate-900'}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className={`block text-[11px] font-semibold ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>
                  Mapeamento das Entidades dos Sensores Merach / ESP32:
                </span>

                {/* Auto-detect button */}
                <button
                  type="button"
                  onClick={handleDiscoverSensors}
                  disabled={discoveringStatus?.loading || !formData.haToken}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50 ${
                    isRose
                      ? 'bg-gradient-to-r from-[#9400D3] to-[#ff2d75] text-white shadow-[0_0_12px_rgba(255,45,117,0.4)]'
                      : 'bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 shadow-sm'
                  }`}
                  title="Detetar automaticamente os sensores da bicicleta no Home Assistant"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${discoveringStatus?.loading ? 'animate-spin' : ''}`} />
                  <span>{discoveringStatus?.loading ? 'A procurar...' : 'Detetar Sensores ESP32'}</span>
                </button>
              </div>

              {discoveringStatus && (
                <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                  discoveringStatus.success
                    ? isRose ? 'bg-[#380743]/60 border-[#ff2d75]/50 text-pink-200' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {discoveringStatus.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />}
                  <span>{discoveringStatus.message}</span>
                </div>
              )}

              {/* Detected sensors interactive shelf */}
              {detectedSensors.length > 0 && (
                <div className={`p-3.5 rounded-2xl border space-y-2.5 max-h-60 overflow-y-auto animate-fadeIn ${
                  isRose ? 'bg-[#290534]/90 border-[#ff2d75]/40 shadow-inner' : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Sensores da Bicicleta Merach ({
                        detectedSensors.filter(s => !sensorFilter.trim() || s.entity_id.toLowerCase().includes(sensorFilter.toLowerCase()) || s.name.toLowerCase().includes(sensorFilter.toLowerCase())).length
                      }):
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={sensorFilter}
                        onChange={(e) => setSensorFilter(e.target.value)}
                        placeholder="Filtrar por nome..."
                        className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/10 text-[10px] text-white focus:outline-none w-28"
                      />
                      {sensorFilter ? (
                        <button
                          type="button"
                          onClick={() => setSensorFilter('')}
                          className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                        >
                          Ver todos
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSensorFilter('merach')}
                          className="text-[10px] text-pink-300 hover:text-white cursor-pointer"
                        >
                          Só Merach
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {detectedSensors
                      .filter(s => !sensorFilter.trim() || s.entity_id.toLowerCase().includes(sensorFilter.toLowerCase()) || s.name.toLowerCase().includes(sensorFilter.toLowerCase()))
                      .map((s) => (
                      <div key={s.entity_id} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 font-bold text-white text-[11px] truncate">
                            <span className="truncate">{s.name}</span>
                            {s.state === 'unavailable' || s.state === 'unknown' ? (
                              <span 
                                className="px-2 py-0.5 rounded bg-amber-500/20 text-[10px] font-sans text-amber-300 border border-amber-500/30 flex items-center gap-1"
                                title="A bicicleta desliga o Bluetooth quando está parada para poupar energia. Ao pedalar volta a ligar."
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Em Repouso (0 {s.unit || 'rpm'})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                                {s.state} {s.unit}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">{s.entity_id}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => assignSensor('cadence', s.entity_id)}
                            className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                              formData.haEntities?.cadence === s.entity_id
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30'
                            }`}
                          >
                            + Cadência
                          </button>
                          <button
                            type="button"
                            onClick={() => assignSensor('speed', s.entity_id)}
                            className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                              formData.haEntities?.speed === s.entity_id
                                ? 'bg-sky-500 text-slate-950 border-sky-400'
                                : 'bg-sky-500/15 border-sky-500/30 text-sky-300 hover:bg-sky-500/30'
                            }`}
                          >
                            + Velocidade
                          </button>
                          <button
                            type="button"
                            onClick={() => assignSensor('resistance', s.entity_id)}
                            className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                              formData.haEntities?.resistance === s.entity_id
                                ? 'bg-purple-500 text-white border-purple-400'
                                : 'bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
                            }`}
                          >
                            + Resistência
                          </button>
                          <button
                            type="button"
                            onClick={() => assignSensor('heartRate', s.entity_id)}
                            className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                              formData.haEntities?.heartRate === s.entity_id
                                ? 'bg-rose-500 text-white border-rose-400'
                                : 'bg-rose-500/15 border-rose-500/30 text-rose-300 hover:bg-rose-500/30'
                            }`}
                          >
                            + Pulso
                          </button>
                          <button
                            type="button"
                            onClick={() => assignSensor('power', s.entity_id)}
                            className={`px-2 py-1 rounded text-[9px] font-bold border transition-colors cursor-pointer ${
                              formData.haEntities?.power === s.entity_id
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/30'
                            }`}
                          >
                            + Potência
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form mapping grid for all metrics with clear buttons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                  <span>Mapeamento dos Sensores:</span>
                  <button
                    type="button"
                    onClick={handleClearAllSensors}
                    className="text-[10px] text-pink-400 hover:text-white underline cursor-pointer"
                  >
                    Limpar todos os campos
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Cadência */}
                  <div>
                    <label className={`block text-[10px] font-semibold mb-1 ${isRose ? 'text-purple-300' : 'text-slate-400'}`}>
                      Cadência (RPM):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.haEntities?.cadence || ''}
                        onChange={(e) => assignSensor('cadence', e.target.value)}
                        placeholder="sensor.merach_cadence"
                        className={`w-full rounded-lg pl-2.5 pr-6 py-1.5 font-mono text-[11px] border ${
                          themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      />
                      {formData.haEntities?.cadence && (
                        <button
                          type="button"
                          onClick={() => assignSensor('cadence', '')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Velocidade */}
                  <div>
                    <label className={`block text-[10px] font-semibold mb-1 ${isRose ? 'text-pink-300' : 'text-slate-400'}`}>
                      Velocidade (km/h):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.haEntities?.speed || ''}
                        onChange={(e) => assignSensor('speed', e.target.value)}
                        placeholder="sensor.merach_speed"
                        className={`w-full rounded-lg pl-2.5 pr-6 py-1.5 font-mono text-[11px] border ${
                          themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      />
                      {formData.haEntities?.speed && (
                        <button
                          type="button"
                          onClick={() => assignSensor('speed', '')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Resistência */}
                  <div>
                    <label className="block text-[10px] font-semibold mb-1 text-purple-300">
                      Resistência (Nível 1-32):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.haEntities?.resistance || ''}
                        onChange={(e) => assignSensor('resistance', e.target.value)}
                        placeholder="number.merach_resistance"
                        className={`w-full rounded-lg pl-2.5 pr-6 py-1.5 font-mono text-[11px] border ${
                          themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      />
                      {formData.haEntities?.resistance && (
                        <button
                          type="button"
                          onClick={() => assignSensor('resistance', '')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Frequência Cardíaca */}
                  <div>
                    <label className="block text-[10px] font-semibold mb-1 text-rose-300">
                      Frequência Cardíaca (BPM):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.haEntities?.heartRate || ''}
                        onChange={(e) => assignSensor('heartRate', e.target.value)}
                        placeholder="sensor.merach_bike_heart"
                        className={`w-full rounded-lg pl-2.5 pr-6 py-1.5 font-mono text-[11px] border ${
                          themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      />
                      {formData.haEntities?.heartRate && (
                        <button
                          type="button"
                          onClick={() => assignSensor('heartRate', '')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Potência */}
                  <div>
                    <label className="block text-[10px] font-semibold mb-1 text-amber-300">
                      Potência (Watts):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.haEntities?.power || ''}
                        onChange={(e) => assignSensor('power', e.target.value)}
                        placeholder="sensor.merach_power (opcional)"
                        className={`w-full rounded-lg pl-2.5 pr-6 py-1.5 font-mono text-[11px] border ${
                          themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      />
                      {formData.haEntities?.power && (
                        <button
                          type="button"
                          onClick={() => assignSensor('power', '')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Distância */}
                  <div>
                    <label className="block text-[10px] font-semibold mb-1 text-sky-300">
                      Distância da Bike (km - opcional):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.haEntities?.distance || ''}
                        onChange={(e) => assignSensor('distance', e.target.value)}
                        placeholder="sensor.merach_distance (opcional)"
                        className={`w-full rounded-lg pl-2.5 pr-6 py-1.5 font-mono text-[11px] border ${
                          themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      />
                      {formData.haEntities?.distance && (
                        <button
                          type="button"
                          onClick={() => assignSensor('distance', '')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingStatus?.loading}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                  isRose
                    ? 'bg-[#380743] hover:bg-[#4d0a5e] text-white border border-[#ff2d75]/40 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testingStatus?.loading ? 'animate-spin' : ''}`} />
                Testar Conexão com Home Assistant
              </button>

              {testingStatus && (
                <div className={`flex items-center gap-1.5 text-[11px] font-medium ${
                  testingStatus.success 
                    ? (isRose ? 'text-pink-300' : 'text-emerald-400')
                    : 'text-rose-400'
                }`}>
                  {testingStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{testingStatus.message}</span>
                </div>
              )}
            </div>

            {/* CORS / Connection Helper Dropdown */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowCorsHelp(!showCorsHelp)}
                className={`text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                  isRose ? 'text-pink-300 hover:text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Como autorizar CORS no Home Assistant (se der erro de ligação)</span>
                {showCorsHelp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showCorsHelp && (
                <div className={`mt-2 p-3 rounded-xl border text-[11px] leading-relaxed font-mono ${
                  isRose 
                    ? 'bg-[#290534] border-[#ff2d75]/40 text-pink-100' 
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}>
                  <p className="font-sans font-semibold mb-1 text-white">
                    Adicione ao seu <code className="text-amber-300">configuration.yaml</code> no Home Assistant e reinicie:
                  </p>
                  <pre className="p-2 rounded bg-black/50 text-[10px] text-emerald-300 overflow-x-auto select-all">
{`http:
  cors_allowed_origins:
    - http://localhost:5173
    - http://127.0.0.1:5173
    - ${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'}`}
                  </pre>
                  <p className="font-sans text-[10px] mt-1 text-slate-400">
                    Isto permite que a interface Web leia a telemetria do ESP32 através da API REST sem bloqueios de segurança do browser.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Google Maps / Street View API Key Configuration */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isRose ? 'bg-[#290534]/50 border-[#ff2d75]/30' : 'bg-slate-900/50 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className={`w-4 h-4 ${isRose ? 'text-[#ff2d75]' : 'text-sky-400'}`} />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Google Street View 360° (Visão Frontal Real)
                </span>
              </div>
              {formData.googleMapsApiKey ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Configurada
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Opcional
                </span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                Chave Google Maps API (API Key):
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={formData.googleMapsApiKey || ''}
                  onChange={(e) => setFormData({ ...formData, googleMapsApiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className={`w-full rounded-xl px-3 py-2 font-mono text-xs border ${
                    themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                Utilizada para renderizar a visão frontal 360° em tempo real nas estradas. Certifique-se de que a API <strong>"Maps JavaScript API"</strong> está ativada na sua Google Cloud Console.
              </p>
            </div>
          </div>

          {/* Base de Dados / Armazenamento (PostgreSQL Unraid) */}
          <div className={`p-4 rounded-2xl border space-y-4 ${
            isRose ? 'bg-[#3b0849]/30 border-[#ff2d75]/30' : 'bg-slate-900/60 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className={`w-4 h-4 ${isRose ? 'text-[#ff2d75]' : 'text-sky-400'}`} />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Base de Dados PostgreSQL (Unraid)
                </span>
              </div>
              {settings?.postgresConnected || postgresTestStatus?.success ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> PostgreSQL Ativo
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                  Ficheiro Local (/app/data)
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Guarda os treinos, estatísticas e percursos personalizados na base de dados PostgreSQL no Unraid com persistência total. Se os campos estiverem vazios, é utilizado o armazenamento em ficheiros locais (<code className="text-slate-300">/app/data</code>).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Host / IP do PostgreSQL:
                </label>
                <input
                  type="text"
                  value={formData.postgresConfig?.host || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    postgresConfig: { ...formData.postgresConfig, host: e.target.value }
                  })}
                  placeholder="ex: 192.168.1.150 ou postgres"
                  className={`w-full rounded-xl px-3 py-2 font-mono text-xs border ${
                    themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Porta:
                </label>
                <input
                  type="number"
                  value={formData.postgresConfig?.port || 5432}
                  onChange={(e) => setFormData({
                    ...formData,
                    postgresConfig: { ...formData.postgresConfig, port: parseInt(e.target.value, 10) || 5432 }
                  })}
                  placeholder="5432"
                  className={`w-full rounded-xl px-3 py-2 font-mono text-xs border ${
                    themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Utilizador:
                </label>
                <input
                  type="text"
                  value={formData.postgresConfig?.user || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    postgresConfig: { ...formData.postgresConfig, user: e.target.value }
                  })}
                  placeholder="postgres"
                  className={`w-full rounded-xl px-3 py-2 font-mono text-xs border ${
                    themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Palavra-passe:
                </label>
                <input
                  type="password"
                  value={formData.postgresConfig?.password || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    postgresConfig: { ...formData.postgresConfig, password: e.target.value }
                  })}
                  placeholder="••••••••"
                  className={`w-full rounded-xl px-3 py-2 font-mono text-xs border ${
                    themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold mb-1 text-slate-300">
                  Nome da Base de Dados:
                </label>
                <input
                  type="text"
                  value={formData.postgresConfig?.database || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    postgresConfig: { ...formData.postgresConfig, database: e.target.value }
                  })}
                  placeholder="merach"
                  className={`w-full rounded-xl px-3 py-2 font-mono text-xs border ${
                    themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                  }`}
                />
              </div>
            </div>

            {/* Test PostgreSQL Connection Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestPostgresConnection}
                disabled={postgresTestStatus?.loading}
                className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isRose
                    ? 'bg-[#ff2d75]/15 border-[#ff2d75]/40 text-[#ff85b3] hover:bg-[#ff2d75]/25'
                    : 'bg-sky-500/15 border-sky-500/40 text-sky-300 hover:bg-sky-500/25'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${postgresTestStatus?.loading ? 'animate-spin' : ''}`} />
                <span>{postgresTestStatus?.loading ? 'A testar ligação...' : 'Testar Ligação PostgreSQL'}</span>
              </button>

              {postgresTestStatus && (
                <div className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 ${
                  postgresTestStatus.success
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {postgresTestStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span className="truncate">{postgresTestStatus.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reset Demo Data Button */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className={isRose ? 'text-pink-200/70' : 'text-slate-500'}>Histórico de treinos gravado no servidor</span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Tem a certeza que deseja apagar todo o histórico de treinos guardado? Esta ação não pode ser desfeita.')) {
                  onResetSampleData();
                  alert('Histórico de treinos limpo com sucesso!');
                }
              }}
              className={`flex items-center gap-1 cursor-pointer transition-colors ${
                isRose ? 'text-rose-400 hover:text-rose-300' : 'text-rose-400 hover:text-rose-300'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Limpar Todo o Histórico de Treinos
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-end gap-3 pt-4 border-t ${
          isRose ? 'border-[#ff2d75]/30' : 'border-slate-800'
        }`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer ${
              isRose
                ? 'bg-[#380743] hover:bg-[#4d0a5e] text-pink-200 border border-[#ff2d75]/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saveSuccess}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r ${
              saveSuccess
                ? 'from-emerald-500 to-teal-500 text-white'
                : themeConfig?.primaryButtonGrad || 'from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400'
            } ${
              isRose && !saveSuccess ? 'text-white' : ''
            } ${
              !isRose && !saveSuccess ? 'text-slate-950' : ''
            } font-bold shadow-lg ${
              themeConfig?.primaryButtonShadow || 'shadow-sky-500/20'
            } active:scale-95 transition-all cursor-pointer`}
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
                <span>Configurações Guardadas!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Configurações</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
