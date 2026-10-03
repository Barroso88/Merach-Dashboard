import React, { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';

export default function ConnectionSettingsModal({
  isOpen,
  onClose,
  settings,
  themeConfig,
  onSaveSettings,
  haService,
  onResetSampleData
}) {
  if (!isOpen) return null;

  const isRose = themeConfig?.id === 'rose';

  const [formData, setFormData] = useState({ ...settings });
  const [testingStatus, setTestingStatus] = useState(null);
  const [discoveringStatus, setDiscoveringStatus] = useState(null);
  const [showCorsHelp, setShowCorsHelp] = useState(false);

  const handleTestConnection = async () => {
    setTestingStatus({ loading: true, message: 'A testar conexão ao Home Assistant...' });
    haService.updateConfig({
      haUrl: formData.haUrl,
      haToken: formData.haToken,
      haEntities: formData.haEntities
    });

    const result = await haService.testConnection();
    setTestingStatus({
      loading: false,
      success: result.success,
      isCors: result.isCors,
      message: result.message
    });
    if (result.isCors) {
      setShowCorsHelp(true);
    }
  };

  const handleDiscoverSensors = async () => {
    setDiscoveringStatus({ loading: true, message: 'A procurar entidades no Home Assistant...' });
    haService.updateConfig({
      haUrl: formData.haUrl,
      haToken: formData.haToken
    });

    try {
      const res = await haService.discoverEntities();
      let updatedEntities = { ...formData.haEntities };
      let foundCount = 0;

      if (res.suggestedCadence) {
        updatedEntities.cadence = res.suggestedCadence;
        foundCount++;
      }
      if (res.suggestedSpeed) {
        updatedEntities.speed = res.suggestedSpeed;
        foundCount++;
      }

      setFormData((prev) => ({
        ...prev,
        haEntities: updatedEntities
      }));

      setDiscoveringStatus({
        loading: false,
        success: true,
        message: foundCount > 0 
          ? `Sucesso! Foram detetados ${foundCount} sensores Merach/ESP32 e preenchidos automaticamente.` 
          : `Foram encontrados ${res.candidates.length} sensores, mas nenhum com o nome padrão exato. Pode selecioná-los manualmente.`
      });
    } catch (err) {
      setDiscoveringStatus({
        loading: false,
        success: false,
        message: err.message
      });
    }
  };

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
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
                <label className={`block font-semibold mb-1 ${isRose ? 'text-pink-200' : 'text-slate-400'}`}>
                  URL do Home Assistant
                </label>
                <input
                  type="text"
                  value={formData.haUrl}
                  onChange={(e) => setFormData({ ...formData, haUrl: e.target.value })}
                  placeholder="http://homeassistant.local:8123"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-[10px] ${isRose ? 'text-purple-300' : 'text-slate-500'}`}>Cadência (RPM):</label>
                  <input
                    type="text"
                    value={formData.haEntities?.cadence || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      haEntities: { ...formData.haEntities, cadence: e.target.value }
                    })}
                    placeholder="sensor.merach_bike_cadence"
                    className={`w-full rounded-lg px-2.5 py-1.5 font-mono text-[11px] border ${
                      themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] ${isRose ? 'text-pink-300' : 'text-slate-500'}`}>Velocidade (km/h):</label>
                  <input
                    type="text"
                    value={formData.haEntities?.speed || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      haEntities: { ...formData.haEntities, speed: e.target.value }
                    })}
                    placeholder="sensor.merach_bike_speed"
                    className={`w-full rounded-lg px-2.5 py-1.5 font-mono text-[11px] border ${
                      themeConfig?.modalInputClass || 'bg-slate-900 border-slate-800 text-slate-200'
                    }`}
                  />
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

          {/* Reset Demo Data Button */}
          <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500">
            <span className={isRose ? 'text-pink-200/70' : 'text-slate-500'}>Desejas repor os dados de exemplo do histórico?</span>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Isto irá repor as sessões de treino de demonstração. Continuar?')) {
                  onResetSampleData();
                  alert('Dados de demonstração repostos com sucesso!');
                }
              }}
              className={`flex items-center gap-1 underline cursor-pointer ${
                isRose ? 'text-pink-300 hover:text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Repor Treinos de Demonstração
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
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r ${
              themeConfig?.primaryButtonGrad || 'from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400'
            } ${
              isRose ? 'text-white' : 'text-slate-950'
            } font-bold shadow-lg ${
              themeConfig?.primaryButtonShadow || 'shadow-sky-500/20'
            } active:scale-95 transition-all cursor-pointer`}
          >
            <Save className="w-4 h-4" />
            Guardar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
