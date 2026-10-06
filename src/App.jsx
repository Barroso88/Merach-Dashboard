import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import LiveDashboard from './components/LiveDashboard';
import AnalyticsView from './components/AnalyticsView';
import WorkoutSummaryModal from './components/WorkoutSummaryModal';
import WorkoutDetailModal from './components/WorkoutDetailModal';
import ConnectionSettingsModal from './components/ConnectionSettingsModal';
import ModalErrorBoundary from './components/ModalErrorBoundary';

import { MerachSimulator } from './services/telemetrySimulator';
import { HomeAssistantService } from './services/homeAssistantService';
import {
  getStoredWorkouts,
  saveWorkoutToStorage,
  deleteWorkoutFromStorage,
  resetWorkoutsToDefault,
  getStoredSettings,
  saveStoredSettings,
  fetchServerSettings,
  fetchServerWorkouts
} from './services/storageService';
import { fetchServerCustomRoutes } from './services/routePlannerService';
import { wakeLockService } from './services/wakeLockService';
import { globalWorkerTimer } from './services/workerTimer';
import { THEMES } from './constants/themes';
import { ChevronDown } from 'lucide-react';

export default function App() {
  // Theme: 'cyan' or 'rose'
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('merach_theme') || 'cyan';
  });

  const handleToggleTheme = () => {
    setCurrentTheme(prev => {
      const next = prev === 'cyan' ? 'rose' : 'cyan';
      localStorage.setItem('merach_theme', next);
      return next;
    });
  };

  // Navigation: 'live' or 'analytics'
  const [activeTab, setActiveTab] = useState('live');

  // Cockpit view mode for live workout: 'gauges' | 'route'
  const [dashboardMode, setDashboardMode] = useState('gauges');

  // Top Navbar auto-collapse for cockpit immersion during workouts
  const [isNavbarCollapsed, setIsNavbarCollapsed] = useState(false);

  // Application Settings
  const [settings, setSettings] = useState(() => getStoredSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Workouts History List
  const [workouts, setWorkouts] = useState(() => getStoredWorkouts());
  const [selectedWorkoutDetail, setSelectedWorkoutDetail] = useState(null);

  // Workout Summary Modal (opened upon finishing)
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [finishedWorkoutData, setFinishedWorkoutData] = useState(null);

  // Telemetry Services instances
  const simulatorRef = useRef(null);
  const haServiceRef = useRef(null);

  if (!simulatorRef.current) {
    simulatorRef.current = new MerachSimulator();
  }
  if (!haServiceRef.current) {
    haServiceRef.current = new HomeAssistantService(settings);
  }

  // Active Simulation Preset ('steady' | 'intervals' | 'climb')
  const [simulationPreset, setSimulationPreset] = useState('steady');

  // Workout Session State
  const [workoutStatus, setWorkoutStatus] = useState('idle'); // 'idle' | 'running' | 'paused'
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Predefined Countdown Target in seconds (0 = free / open workout)
  const [targetSeconds, setTargetSeconds] = useState(() => {
    const saved = localStorage.getItem('merach_target_seconds');
    return saved ? Number(saved) : 0;
  });
  const [isTargetReached, setIsTargetReached] = useState(false);

  const handleSelectTargetSeconds = (sec) => {
    setTargetSeconds(sec);
    localStorage.setItem('merach_target_seconds', String(sec));
  };

  // Official Merach Telemetry (Cadence, Speed, Power, Resistance, Heart Rate)
  const [telemetry, setTelemetry] = useState({
    cadence: 0,
    speed: 0,
    power: 0,
    resistance: 0,
    heartRate: 0
  });

  // Session Cumulative Stats
  const [sessionStats, setSessionStats] = useState({
    distanceKm: 0,
    caloriesKcal: 0,
    avgSpeed: 0,
    maxSpeed: 0,
    avgCadence: 0,
    maxCadence: 0,
    samplesCount: 0
  });

  // Rolling real-time graph data points (speed and cadence)
  const [chartHistory, setChartHistory] = useState([]);

  // Samples recorded throughout the entire session
  const sessionSamplesRef = useRef([]);

  // Wall-clock timestamp tracking for bulletproof background & tablet sleep resilience
  const workoutStartTimeRef = useRef(null);
  const accumulatedPausedTimeRef = useRef(0);
  const lastPauseTimestampRef = useRef(null);
  const lastTickTimeRef = useRef(null);
  const lastTelemetryRef = useRef({ speed: 0, cadence: 0 });
  const lastRecordedSecRef = useRef(0);

  // Screen Wake Lock manager for tablets and mobile devices
  useEffect(() => {
    if (activeTab === 'live' && settings.keepScreenAwake !== false) {
      wakeLockService.requestWakeLock();
    } else if (activeTab !== 'live' && workoutStatus === 'idle') {
      wakeLockService.releaseWakeLock();
    }
  }, [activeTab, settings.keepScreenAwake, workoutStatus]);

  // Page Visibility handler: immediately catches up wall-clock time & re-acquires Wake Lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;

      if (document.visibilityState === 'visible') {
        // 1. Re-acquire Screen Wake Lock when screen wakes up or returning to app
        if (settings.keepScreenAwake !== false && activeTab === 'live') {
          wakeLockService.requestWakeLock();
        }

        // 2. If workout is running, calculate immediate wall-clock catch up
        if (workoutStatus === 'running' && workoutStartTimeRef.current) {
          const now = Date.now();
          const start = workoutStartTimeRef.current;
          const paused = accumulatedPausedTimeRef.current || 0;
          const currentElapsed = Math.max(0, Math.floor((now - start - paused) / 1000));
          setElapsedSeconds(currentElapsed);

          const lastTick = lastTickTimeRef.current || now;
          const actualDt = Math.max(0.05, (now - lastTick) / 1000);
          lastTickTimeRef.current = now;

          const mins = Math.floor(currentElapsed / 60);
          const secs = currentElapsed % 60;
          const timeLabel = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

          if (settings.mode === 'homeassistant') {
            haServiceRef.current.fetchTelemetry()
              .then((data) => {
                applyTick(data, actualDt, true, currentElapsed, timeLabel);
              })
              .catch(() => {});
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [workoutStatus, settings.keepScreenAwake, settings.mode, activeTab]);

  // Telemetry loop effect with WorkerTimer (background-safe, zero throttling)
  useEffect(() => {
    let isSubscribed = true;

    if (workoutStatus === 'running') {
      globalWorkerTimer.start(500, async () => {
        if (!isSubscribed) return;

        const now = Date.now();
        const start = workoutStartTimeRef.current || now;
        const paused = accumulatedPausedTimeRef.current || 0;
        const currentElapsed = Math.max(0, Math.floor((now - start - paused) / 1000));
        setElapsedSeconds(currentElapsed);

        const lastTick = lastTickTimeRef.current || now;
        const actualDt = Math.max(0.05, (now - lastTick) / 1000);
        lastTickTimeRef.current = now;

        const isFullSecond = currentElapsed !== lastRecordedSecRef.current;
        let timeLabel = '';
        if (isFullSecond) {
          lastRecordedSecRef.current = currentElapsed;
          const mins = Math.floor(currentElapsed / 60);
          const secs = currentElapsed % 60;
          timeLabel = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

          // Check if target countdown completed
          if (targetSeconds > 0 && currentElapsed >= targetSeconds) {
            setIsTargetReached(true);
          }
        }

        if (settings.mode === 'homeassistant') {
          haServiceRef.current.fetchTelemetry()
            .then((data) => {
              if (isSubscribed) {
                applyTick(data, actualDt, isFullSecond, currentElapsed, timeLabel);
              }
            })
            .catch(() => {
              if (isSubscribed) {
                const currentTick = simulatorRef.current.nextTick(false);
                applyTick(currentTick, actualDt, isFullSecond, currentElapsed, timeLabel);
              }
            });
        } else {
          const currentTick = simulatorRef.current.nextTick(false);
          applyTick(currentTick, actualDt, isFullSecond, currentElapsed, timeLabel);
        }
      });
    } else if (workoutStatus === 'idle') {
      globalWorkerTimer.stop();
      if (settings.mode === 'homeassistant') {
        globalWorkerTimer.start(500, async () => {
          if (!isSubscribed) return;
          haServiceRef.current.fetchTelemetry()
            .then((data) => {
              if (!isSubscribed) return;
              const liveCadence = data.cadence ?? 0;
              const liveSpeed = data.speed ?? 0;
              setTelemetry({
                cadence: liveCadence,
                speed: liveSpeed,
                power: data.power ?? 0,
                resistance: data.resistance ?? 0,
                heartRate: data.heartRate ?? 0
              });

              // Automatically start workout session when user starts pedaling!
              if (liveCadence > 15 || liveSpeed > 4) {
                handleStartWorkout();
              }
            })
            .catch(() => {});
        });
      }
    } else if (workoutStatus === 'paused') {
      globalWorkerTimer.stop();
      globalWorkerTimer.start(500, async () => {
        if (!isSubscribed) return;
        if (settings.mode === 'homeassistant') {
          haServiceRef.current.fetchTelemetry()
            .then((data) => {
              if (!isSubscribed) return;
              setTelemetry({
                cadence: data.cadence ?? 0,
                speed: data.speed ?? 0,
                power: data.power ?? 0,
                resistance: data.resistance ?? 0,
                heartRate: data.heartRate ?? 0
              });
            })
            .catch(() => {});
        } else {
          const coolTick = simulatorRef.current.nextTick(true);
          setTelemetry(coolTick);
        }
      });
    }

    return () => {
      isSubscribed = false;
      globalWorkerTimer.stop();
    };
  }, [workoutStatus, settings.mode, targetSeconds]);

  // Effect to automatically stop workout when target countdown is achieved
  useEffect(() => {
    if (isTargetReached && workoutStatus === 'running') {
      setIsTargetReached(false);
      handleStopWorkout();
    }
  }, [isTargetReached, workoutStatus]);

  // Apply tick data to session aggregates (supports variable dt wall-clock integration)
  const applyTick = (tick, dt = 0.5, isFullSecond = false, currentSec = 0, timeLabel = '') => {
    setTelemetry({
      cadence: tick.cadence ?? 0,
      speed: tick.speed ?? 0,
      power: tick.power ?? 0,
      resistance: tick.resistance ?? 0,
      heartRate: tick.heartRate ?? 0
    });

    // Record sample for detailed replay and rolling chart on each full second
    if (isFullSecond) {
      if (currentSec % 3 === 0 || currentSec <= 10) {
        sessionSamplesRef.current.push({
          time: `${Math.round(currentSec / 60)}m`,
          cadence: tick.cadence,
          speed: tick.speed,
          power: tick.power,
          resistance: tick.resistance
        });
      }

      if (timeLabel) {
        setChartHistory((prevHistory) => {
          const nextItem = {
            time: timeLabel,
            cadence: tick.cadence,
            speed: tick.speed
          };
          const updated = [...prevHistory, nextItem];
          return updated.length > 35 ? updated.slice(updated.length - 35) : updated;
        });
      }
    }

    // Update cumulative metrics according to official indoor bike formula with dt factor
    setSessionStats((prev) => {
      const speedKmH = Number(tick.speed) || 0;
      const cadenceRpm = Number(tick.cadence) || 0;

      // When recovering from a background interval, average speeds across the interval
      const effectiveSpeed = (lastTelemetryRef.current.speed > 0 && speedKmH > 0)
        ? (lastTelemetryRef.current.speed + speedKmH) / 2
        : speedKmH;
      const effectiveCadence = (lastTelemetryRef.current.cadence > 0 && cadenceRpm > 0)
        ? Math.round((lastTelemetryRef.current.cadence + cadenceRpm) / 2)
        : cadenceRpm;

      const distIncrement = (effectiveSpeed / 3600) * dt;
      const calIncrement = (((effectiveSpeed * 0.22) + (effectiveCadence * 0.05)) / 60) * dt;

      lastTelemetryRef.current = { speed: speedKmH, cadence: cadenceRpm };

      const newDistance = prev.distanceKm + distIncrement;
      const newCalories = prev.caloriesKcal + calIncrement;

      const weight = Math.max(1, Math.round(dt * 2));
      const count = prev.samplesCount + weight;
      const newAvgSpeed = Number((((prev.avgSpeed * prev.samplesCount) + (effectiveSpeed * weight)) / count).toFixed(1));
      const newMaxSpeed = Math.max(prev.maxSpeed, speedKmH);
      const newAvgCadence = Math.round(((prev.avgCadence * prev.samplesCount) + (effectiveCadence * weight)) / count);
      const newMaxCadence = Math.max(prev.maxCadence, cadenceRpm);

      return {
        distanceKm: newDistance,
        caloriesKcal: newCalories,
        avgSpeed: newAvgSpeed,
        maxSpeed: newMaxSpeed,
        avgCadence: newAvgCadence,
        maxCadence: newMaxCadence,
        samplesCount: count
      };
    });
  };

  // Workout Controls Handlers
  const handleStartWorkout = () => {
    const now = Date.now();
    workoutStartTimeRef.current = now;
    accumulatedPausedTimeRef.current = 0;
    lastPauseTimestampRef.current = null;
    lastTickTimeRef.current = now;
    lastRecordedSecRef.current = 0;
    setElapsedSeconds(0);
    setWorkoutStatus('running');
    setIsNavbarCollapsed(true);
    sessionSamplesRef.current = [];

    if (settings.keepScreenAwake !== false) {
      wakeLockService.requestWakeLock();
    }
    if (settings.preventBackgroundSuspension !== false) {
      wakeLockService.enableBackgroundAudio();
    }
  };

  const handlePauseWorkout = () => {
    lastPauseTimestampRef.current = Date.now();
    setWorkoutStatus('paused');
  };

  const handleResumeWorkout = () => {
    const now = Date.now();
    if (lastPauseTimestampRef.current) {
      accumulatedPausedTimeRef.current += (now - lastPauseTimestampRef.current);
      lastPauseTimestampRef.current = null;
    }
    lastTickTimeRef.current = now;
    setWorkoutStatus('running');
    setIsNavbarCollapsed(true);

    if (settings.keepScreenAwake !== false) {
      wakeLockService.requestWakeLock();
    }
    if (settings.preventBackgroundSuspension !== false) {
      wakeLockService.enableBackgroundAudio();
    }
  };

  const handleStopWorkout = () => {
    const now = Date.now();
    let finalDuration = elapsedSeconds;
    if (workoutStartTimeRef.current) {
      const paused = accumulatedPausedTimeRef.current || 0;
      finalDuration = Math.max(0, Math.floor((now - workoutStartTimeRef.current - paused) / 1000));
    }

    setWorkoutStatus('idle');
    setIsNavbarCollapsed(false);

    wakeLockService.releaseWakeLock();
    wakeLockService.disableBackgroundAudio();

    // Build finished workout summary
    const summary = {
      id: `wo-${Date.now()}`,
      title: 'Treino Merach Bike',
      date: new Date().toISOString(),
      durationSeconds: finalDuration,
      distanceKm: Number((sessionStats.distanceKm || 0).toFixed(2)),
      caloriesKcal: Math.round(sessionStats.caloriesKcal || 0),
      avgSpeed: sessionStats.avgSpeed,
      maxSpeed: sessionStats.maxSpeed,
      avgCadence: sessionStats.avgCadence,
      maxCadence: sessionStats.maxCadence,
      samples: sessionSamplesRef.current.length > 0 ? sessionSamplesRef.current : [
        { time: '0m', cadence: sessionStats.avgCadence, speed: sessionStats.avgSpeed }
      ]
    };

    setFinishedWorkoutData(summary);
    setIsSummaryModalOpen(true);
  };

  const handleResetWorkout = () => {
    workoutStartTimeRef.current = null;
    accumulatedPausedTimeRef.current = 0;
    lastPauseTimestampRef.current = null;
    lastTickTimeRef.current = null;
    lastRecordedSecRef.current = 0;
    setWorkoutStatus('idle');
    setIsNavbarCollapsed(false);
    setElapsedSeconds(0);
    wakeLockService.releaseWakeLock();
    wakeLockService.disableBackgroundAudio();
    setTelemetry({
      cadence: 0,
      speed: 0
    });
    setSessionStats({
      distanceKm: 0,
      caloriesKcal: 0,
      avgSpeed: 0,
      maxSpeed: 0,
      avgCadence: 0,
      maxCadence: 0,
      samplesCount: 0
    });
    setChartHistory([]);
    sessionSamplesRef.current = [];
  };

  // Save finished workout to storage
  const handleSaveFinishedWorkout = (workout) => {
    const updated = saveWorkoutToStorage(workout);
    if (updated) {
      setWorkouts(updated);
    }
    setIsSummaryModalOpen(false);
    handleResetWorkout();
    setActiveTab('analytics');
  };

  const handleDiscardFinishedWorkout = () => {
    setIsSummaryModalOpen(false);
    handleResetWorkout();
  };

  // Preset simulator change
  const handleSimulationPresetChange = (preset) => {
    setSimulationPreset(preset);
    simulatorRef.current.setPreset(preset);
  };

  // Delete workout
  const handleDeleteWorkout = (id) => {
    const updated = deleteWorkoutFromStorage(id);
    if (updated) {
      setWorkouts(updated);
    }
  };

  // Reset demo data
  const handleResetSampleData = () => {
    const resetList = resetWorkoutsToDefault();
    setWorkouts(resetList);
  };

  // Save Settings
  const handleSaveSettings = (newSettings) => {
    const saved = saveStoredSettings(newSettings);
    setSettings(saved);
    haServiceRef.current.updateConfig(saved);
  };

  const formatElapsedTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Synchronize document body background with active theme
  useEffect(() => {
    const active = THEMES[currentTheme] || THEMES.cyan;
    if (typeof document !== 'undefined') {
      document.body.style.backgroundColor = active.bgBody;
    }
  }, [currentTheme]);

  // Central Server Synchronization (Unraid Docker backend)
  // Ensures any device (tablet on the bike, mobile, PC) instantly receives the saved HA token & settings
  useEffect(() => {
    fetchServerSettings().then((serverSettings) => {
      if (serverSettings) {
        setSettings(serverSettings);
        if (haServiceRef.current) {
          haServiceRef.current.updateConfig(serverSettings);
        }
      }
    });

    fetchServerWorkouts().then((serverWorkouts) => {
      if (serverWorkouts && Array.isArray(serverWorkouts)) {
        setWorkouts(serverWorkouts);
      }
    });

    fetchServerCustomRoutes();
  }, []);

  const activeTheme = THEMES[currentTheme] || THEMES.cyan;
  const isRose = currentTheme === 'rose';

  return (
    <div className={`min-h-screen ${activeTheme.bgAppClass} text-slate-100 flex flex-col font-sans transition-colors duration-700 relative overflow-x-hidden ${
      isRose ? 'selection:bg-rose-500 selection:text-white' : 'selection:bg-sky-500 selection:text-white'
    }`}>
      {/* Dynamic atmospheric radial backdrop */}
      <div 
        className={`fixed inset-0 pointer-events-none transition-opacity duration-700 ${
          isRose 
            ? 'bg-[radial-gradient(ellipse_90%_80%_at_50%_-15%,rgba(244,63,94,0.18),transparent)]' 
            : 'bg-[radial-gradient(ellipse_90%_80%_at_50%_-15%,rgba(56,189,248,0.14),transparent)]'
        }`} 
      />

      {/* Background ambient lighting spheres */}
      <div className={`fixed -top-24 left-1/4 w-[750px] h-[750px] rounded-full ${activeTheme.ambientGlow1} blur-[160px] pointer-events-none transition-all duration-700`} />
      <div className={`fixed -bottom-24 right-10 w-[700px] h-[700px] rounded-full ${activeTheme.ambientGlow2} blur-[160px] pointer-events-none transition-all duration-700`} />

      {/* Floating Bar Invocation Button (Cockpit Immersion Mode) */}
      {isNavbarCollapsed && (workoutStatus === 'running' || workoutStatus === 'paused') && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 animate-fadeIn">
          <button
            onClick={() => setIsNavbarCollapsed(false)}
            className={`group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-xl border shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${
              isRose
                ? 'bg-[#260431]/92 hover:bg-[#380743] border-[#ff2d75]/50 text-[#ff85b3] hover:text-white shadow-[0_0_20px_rgba(255,45,117,0.35)]'
                : 'bg-slate-900/90 hover:bg-slate-800 border-sky-500/40 text-sky-300 hover:text-white shadow-[0_0_20px_rgba(56,189,248,0.25)]'
            }`}
            title="Invocar Barra Superior"
          >
            <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
            <span className="tracking-wide">Barra Superior</span>
            <span className={`w-2 h-2 rounded-full ${isRose ? 'bg-[#ff2d75]' : 'bg-emerald-400'} animate-pulse`} />
          </button>
        </div>
      )}

      {/* Main Top Navigation Bar (Collapsible) */}
      <div className={`transition-all duration-500 ease-in-out z-40 ${
        isNavbarCollapsed && (workoutStatus === 'running' || workoutStatus === 'paused')
          ? '-translate-y-full max-h-0 opacity-0 pointer-events-none overflow-hidden'
          : 'translate-y-0 max-h-24 opacity-100'
      }`}>
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          dashboardMode={dashboardMode}
          onToggleDashboardMode={() => setDashboardMode(prev => prev === 'route' ? 'gauges' : 'route')}
          onSetDashboardMode={setDashboardMode}
          mode={settings.mode}
          workoutStatus={workoutStatus}
          elapsedTimeFormatted={formatElapsedTimer(elapsedSeconds)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          currentTheme={currentTheme}
          onToggleTheme={handleToggleTheme}
          isCollapsed={isNavbarCollapsed}
          onToggleCollapse={() => setIsNavbarCollapsed(prev => !prev)}
        />
      </div>

      {/* Main Content Area */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 relative z-10 transition-all duration-500 ${
        isNavbarCollapsed && (workoutStatus === 'running' || workoutStatus === 'paused') ? 'pt-10 pb-6' : 'py-6'
      }`}>
        {activeTab === 'live' ? (
          <LiveDashboard
            telemetry={telemetry}
            workoutStatus={workoutStatus}
            elapsedSeconds={elapsedSeconds}
            targetSeconds={targetSeconds}
            onSelectTargetSeconds={handleSelectTargetSeconds}
            sessionStats={sessionStats}
            chartHistory={chartHistory}
            themeConfig={activeTheme}
            settings={settings}
            onStart={handleStartWorkout}
            onPause={handlePauseWorkout}
            onResume={handleResumeWorkout}
            onStop={handleStopWorkout}
            onReset={handleResetWorkout}
            onSimulationPresetChange={handleSimulationPresetChange}
            simulationPreset={simulationPreset}
            dashboardMode={dashboardMode}
            setDashboardMode={setDashboardMode}
          />
        ) : (
          <AnalyticsView
            workouts={workouts}
            themeConfig={activeTheme}
            onDeleteWorkout={handleDeleteWorkout}
            onSelectWorkout={(w) => setSelectedWorkoutDetail(w)}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        workoutStatus={workoutStatus}
        currentTheme={currentTheme}
      />

      {/* Modal: Workout Completion Celebration */}
      <WorkoutSummaryModal
        isOpen={isSummaryModalOpen}
        workoutData={finishedWorkoutData}
        themeConfig={activeTheme}
        onSave={handleSaveFinishedWorkout}
        onDiscard={handleDiscardFinishedWorkout}
      />

      {/* Modal: Workout Detailed Inspection */}
      <WorkoutDetailModal
        isOpen={Boolean(selectedWorkoutDetail)}
        workout={selectedWorkoutDetail}
        themeConfig={activeTheme}
        onClose={() => setSelectedWorkoutDetail(null)}
        onDelete={handleDeleteWorkout}
      />

      {/* Modal: Settings and Home Assistant Integration */}
      <ModalErrorBoundary onClose={() => setIsSettingsOpen(false)}>
        <ConnectionSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={settings}
          themeConfig={activeTheme}
          onSave={handleSaveSettings}
          onSaveSettings={handleSaveSettings}
          haService={haServiceRef.current}
          onResetSampleData={handleResetSampleData}
        />
      </ModalErrorBoundary>
    </div>
  );
}
