import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Compass,
  RotateCcw,
  AlertTriangle,
  MapPin,
  ExternalLink,
  Layers,
  Sparkles,
  Eye,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { loadGoogleMaps, hasGoogleMapsAuthError } from '../services/googleMapsLoader';

export default function StreetViewPanoramaView({
  lat,
  lng,
  bearing = 0,
  gradient = 0,
  speedKmH = 0,
  cadenceRpm = 0,
  currentDistanceKm = 0,
  currentRoute,
  isRose = false,
  primaryColor = '#38bdf8',
  apiKey = '',
  onSwitchToMap
}) {
  const containerRef = useRef(null);
  const panoramaRef = useRef(null);
  const svServiceRef = useRef(null);
  const lastPositionRef = useRef({ lat: 0, lng: 0 });
  const isUpdatingRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(hasGoogleMapsAuthError());
  const [autoHeading, setAutoHeading] = useState(true);
  const [currentPanoInfo, setCurrentPanoInfo] = useState(null);
  const [userInteracting, setUserInteracting] = useState(false);

  // Calculate realistic camera pitch based on road gradient (climbing looks slightly up, descent looks down)
  const targetPitch = Math.max(-12, Math.min(12, gradient * 0.8));

  // Listen for Google Maps Auth Failures
  useEffect(() => {
    const handleAuthError = () => {
      setAuthError(true);
      setError('A chave Google Maps API foi recusada pela Google. Certifique-se de que a "Maps JavaScript API" está ativada na sua consola Google Cloud.');
    };
    window.addEventListener('google-maps-auth-error', handleAuthError);
    return () => {
      window.removeEventListener('google-maps-auth-error', handleAuthError);
    };
  }, []);

  // Distance helper in meters between two lat/lng points
  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Initialize Street View Panorama
  useEffect(() => {
    let isCancelled = false;

    if (!containerRef.current) return;

    const initStreetView = async () => {
      setLoading(true);
      setError(null);

      try {
        const googleMaps = await loadGoogleMaps(apiKey);
        if (isCancelled || !containerRef.current) return;

        if (!panoramaRef.current) {
          svServiceRef.current = new googleMaps.StreetViewService();

          const pano = new googleMaps.StreetViewPanorama(containerRef.current, {
            position: { lat, lng },
            pov: {
              heading: bearing || 0,
              pitch: targetPitch
            },
            zoom: 1,
            addressControl: false,
            showRoadLabels: true,
            zoomControl: true,
            fullscreenControl: false,
            motionTracking: false,
            motionTrackingControl: false,
            linksControl: true,
            panControl: true,
            enableCloseButton: false,
            visible: true
          });

          // Detect user manual pan
          pano.addListener('pov_changed', () => {
            // If user explicitly drags, don't jerk it back immediately unless autoHeading is active during pedaling
          });

          pano.addListener('status_changed', () => {
            const status = pano.getStatus();
            if (status === googleMaps.StreetViewStatus.ZERO_RESULTS) {
              console.warn('Nenhum panorama Street View encontrado exatamente neste ponto.');
            }
          });

          pano.addListener('pano_changed', () => {
            const panoId = pano.getPano();
            setCurrentPanoInfo(panoId);
          });

          panoramaRef.current = pano;
          lastPositionRef.current = { lat, lng };
        }

        setLoading(false);
      } catch (err) {
        if (!isCancelled) {
          console.error('Erro ao inicializar Street View:', err);
          setError(err.message || 'Não foi possível carregar a vista Street View.');
          setLoading(false);
        }
      }
    };

    initStreetView();

    return () => {
      isCancelled = true;
    };
  }, [apiKey]);

  // Update Panorama Position & POV when rider moves along the route
  useEffect(() => {
    const panorama = panoramaRef.current;
    const svService = svServiceRef.current;
    if (!panorama || !svService || !window.google?.maps) return;

    const distMoved = getDistanceMeters(
      lastPositionRef.current.lat,
      lastPositionRef.current.lng,
      lat,
      lng
    );

    // Only query Street View if moved more than 7 meters or first load
    if (distMoved >= 7 || lastPositionRef.current.lat === 0) {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;

      svService.getPanorama(
        {
          location: { lat, lng },
          radius: 80, // 80 meters search radius
          source: window.google.maps.StreetViewSource.OUTDOOR,
          preference: window.google.maps.StreetViewPreference.NEAREST
        },
        (data, status) => {
          isUpdatingRef.current = false;
          if (status === window.google.maps.StreetViewStatus.OK && data?.location?.pano) {
            panorama.setPano(data.location.pano);
            lastPositionRef.current = { lat, lng };

            if (autoHeading) {
              panorama.setPov({
                heading: bearing || 0,
                pitch: targetPitch
              });
            }
          } else {
            // Fallback: try default panorama setPosition
            panorama.setPosition({ lat, lng });
            lastPositionRef.current = { lat, lng };
            if (autoHeading) {
              panorama.setPov({
                heading: bearing || 0,
                pitch: targetPitch
              });
            }
          }
        }
      );
    } else if (autoHeading) {
      // Just update heading smoothly if in the same spot but turning
      panorama.setPov({
        heading: bearing || 0,
        pitch: targetPitch
      });
    }
  }, [lat, lng, bearing, targetPitch, autoHeading]);

  // Re-center camera straight ahead to the road
  const handleRecenterHeading = () => {
    if (panoramaRef.current) {
      panoramaRef.current.setPov({
        heading: bearing || 0,
        pitch: targetPitch
      });
      setAutoHeading(true);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Street View Google Maps Container */}
      <div
        ref={containerRef}
        className="w-full h-full z-0"
        style={{ minHeight: '100%' }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div
            className="w-14 h-14 rounded-full border-4 border-t-transparent animate-spin mb-4"
            style={{ borderColor: `${primaryColor} transparent ${primaryColor} ${primaryColor}` }}
          />
          <h4 className="text-white font-bold text-base mb-1">A carregar Street View 360°...</h4>
          <p className="text-slate-400 text-xs max-w-sm">
            A conectar ao Google Street View para a rota real na estrada.
          </p>
        </div>
      )}

      {/* Auth / Configuration Error Overlay */}
      {(error || authError) && !loading && (
        <div className="absolute inset-0 z-30 bg-slate-950/92 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400 shadow-xl">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-white font-bold text-lg mb-2">Google Street View Requer Configuração</h3>
          <p className="text-slate-300 text-xs max-w-md mb-4 leading-relaxed">
            A sua chave foi inserida, mas a Google Cloud requer que a API <strong className="text-amber-300">"Maps JavaScript API"</strong> esteja ativada no seu projeto Google Cloud.
          </p>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 max-w-md w-full text-left text-xs mb-6 space-y-2">
            <p className="font-bold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Como ativar em 1 minuto na Google:
            </p>
            <ol className="list-decimal list-inside text-slate-400 space-y-1.5 pl-1">
              <li>Abra a <strong className="text-slate-200">Google Cloud Console</strong></li>
              <li>Vá a <strong>APIs e Serviços</strong> &gt; <strong>Biblioteca</strong></li>
              <li>Pesquise por <strong>Maps JavaScript API</strong> e clique em <strong>Ativar</strong></li>
            </ol>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setAuthError(false);
                setLoading(true);
                window.location.reload();
              }}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tentar Novamente
            </button>
            {onSwitchToMap && (
              <button
                type="button"
                onClick={onSwitchToMap}
                className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                Usar Mapa Satélite HD (Sem Necessidade de Chave)
              </button>
            )}
          </div>
        </div>
      )}

      {/* STREET VIEW HUD: Cockpit Overlay */}
      {!loading && !error && !authError && (
        <>
          {/* Compass & Heading Cockpit (Top Left) */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-auto">
            <div className="px-3 py-1.5 rounded-2xl backdrop-blur-xl border border-white/15 bg-black/75 shadow-lg flex items-center gap-2 font-mono text-xs text-white">
              <div
                className="w-4 h-4 rounded-full border border-sky-400 flex items-center justify-center transition-transform duration-300"
                style={{ transform: `rotate(${bearing}deg)` }}
                title={`Orientação da estrada: ${Math.round(bearing)}°`}
              >
                <div className="w-0.5 h-2 bg-sky-400 rounded-full" />
              </div>
              <span className="font-bold text-[11px] text-sky-300">{Math.round(bearing)}°</span>
              <span className="text-[10px] text-slate-400 border-l border-white/20 pl-2">
                {bearing >= 337.5 || bearing < 22.5
                  ? 'Norte (N)'
                  : bearing >= 22.5 && bearing < 67.5
                  ? 'Nordeste (NE)'
                  : bearing >= 67.5 && bearing < 112.5
                  ? 'Este (E)'
                  : bearing >= 112.5 && bearing < 157.5
                  ? 'Sudeste (SE)'
                  : bearing >= 157.5 && bearing < 202.5
                  ? 'Sul (S)'
                  : bearing >= 202.5 && bearing < 247.5
                  ? 'Sudoeste (SO)'
                  : bearing >= 247.5 && bearing < 292.5
                  ? 'Oeste (O)'
                  : 'Noroeste (NO)'}
              </span>
            </div>

            {/* Live Street View Badge */}
            <div className="px-2.5 py-1.5 rounded-2xl backdrop-blur-xl border border-emerald-500/40 bg-emerald-950/80 text-emerald-300 font-bold text-[10px] flex items-center gap-1.5 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Visão Frontal 360° Real</span>
            </div>
          </div>

          {/* Camera Controls (Top Right) */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
            {/* Re-center / Auto Heading Button */}
            <button
              type="button"
              onClick={handleRecenterHeading}
              className={`px-3 py-2 rounded-2xl backdrop-blur-xl border text-xs font-bold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer ${
                autoHeading
                  ? isRose
                    ? 'bg-[#ff2d75] border-[#ff2d75] text-white'
                    : 'bg-sky-500 border-sky-400 text-slate-950'
                  : 'bg-black/75 border-white/20 text-slate-200 hover:text-white'
              }`}
              title="Alinhar visão com a direção da estrada"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Centrar Estrada</span>
            </button>
          </div>

          {/* Cycling Cockpit Bar (Bottom Overlay) */}
          <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none">
            <div className={`p-3.5 rounded-3xl backdrop-blur-2xl border shadow-2xl pointer-events-auto flex flex-wrap items-center justify-between gap-3 ${
              isRose ? 'bg-[#1b0323]/85 border-[#ff2d75]/40' : 'bg-slate-950/85 border-slate-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
                  🚴
                </div>
                <div>
                  <p className="text-white text-xs font-bold truncate max-w-[200px] sm:max-w-xs">
                    {currentRoute?.name || 'Percurso Real'}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {currentDistanceKm} km percorridos • {Math.round(speedKmH)} km/h • {cadenceRpm} RPM
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-right font-mono">
                  <span className="block text-[8px] uppercase tracking-wider text-slate-400">Inclinação</span>
                  <span className={`text-xs font-black ${gradient > 2 ? 'text-rose-400' : gradient < -1 ? 'text-sky-400' : 'text-emerald-400'}`}>
                    {gradient >= 0 ? '+' : ''}{gradient}%
                  </span>
                </div>
                {onSwitchToMap && (
                  <button
                    type="button"
                    onClick={onSwitchToMap}
                    className="px-3 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>Ver Mapa</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
