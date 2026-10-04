// LocalStorage & Server Sync Service for Official Merach Workout History & Settings

const STORAGE_KEY_WORKOUTS = 'merach_official_workouts_v2';
const STORAGE_KEY_SETTINGS = 'merach_official_settings_v2';

// Seed initial realistic workouts matching official Merach app data
const INITIAL_WORKOUTS = [
  {
    id: 'wo-1',
    title: 'Sessão Matinal de Ritmo Ágil',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 2100, // 35 min
    avgCadence: 86,
    maxCadence: 112,
    avgSpeed: 31.4,
    maxSpeed: 44.8,
    distanceKm: 18.3,
    caloriesKcal: 385,
    avgResistance: 14,
    notes: 'Boa fluidez e cadência consistente no nível 14.',
    samples: generateMockSessionSamples(35, 86, 31.4)
  },
  {
    id: 'wo-2',
    title: 'Treino de Resistência Aeróbica',
    date: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 2700, // 45 min
    avgCadence: 82,
    maxCadence: 94,
    avgSpeed: 28.1,
    maxSpeed: 33.5,
    distanceKm: 21.0,
    caloriesKcal: 440,
    avgResistance: 12,
    notes: 'Giro constante para queima calórica.',
    samples: generateMockSessionSamples(45, 82, 28.1)
  },
  {
    id: 'wo-3',
    title: 'Simulação de Subida',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 1800, // 30 min
    avgCadence: 74,
    maxCadence: 90,
    avgSpeed: 25.6,
    maxSpeed: 36.2,
    distanceKm: 12.8,
    caloriesKcal: 360,
    avgResistance: 22,
    notes: 'Resistência alta para fortalecimento muscular das pernas.',
    samples: generateMockSessionSamples(30, 74, 25.6)
  },
  {
    id: 'wo-4',
    title: 'Soltura & Recuperação',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 1500, // 25 min
    avgCadence: 92,
    maxCadence: 100,
    avgSpeed: 26.0,
    maxSpeed: 30.5,
    distanceKm: 10.5,
    caloriesKcal: 220,
    avgResistance: 8,
    notes: 'Recuperação ativa regenerativa.',
    samples: generateMockSessionSamples(25, 92, 26.0)
  },
  {
    id: 'wo-5',
    title: 'Treino Intervalado de Alta Intensidade',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 2400, // 40 min
    avgCadence: 90,
    maxCadence: 122,
    avgSpeed: 34.2,
    maxSpeed: 48.0,
    distanceKm: 22.8,
    caloriesKcal: 510,
    avgResistance: 16,
    notes: 'Séries de sprints de 1 minuto em rotação máxima.',
    samples: generateMockSessionSamples(40, 90, 34.2)
  },
  {
    id: 'wo-6',
    title: 'Pedal Longo de Domingo',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 3600, // 60 min
    avgCadence: 80,
    maxCadence: 96,
    avgSpeed: 29.5,
    maxSpeed: 38.0,
    distanceKm: 29.5,
    caloriesKcal: 590,
    avgResistance: 11,
    notes: 'Foco em consistência de cadência e respiração rítmica.',
    samples: generateMockSessionSamples(60, 80, 29.5)
  },
  {
    id: 'wo-7',
    title: 'Desafio Contrarrelógio',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 1200, // 20 min
    avgCadence: 98,
    maxCadence: 118,
    avgSpeed: 38.0,
    maxSpeed: 46.5,
    distanceKm: 12.6,
    caloriesKcal: 310,
    avgResistance: 15,
    notes: 'Esforço máximo sustentado de limiar.',
    samples: generateMockSessionSamples(20, 98, 38.0)
  }
];

function generateMockSessionSamples(durationMinutes, targetCadence, targetSpeed) {
  const points = [];
  const totalPoints = Math.min(25, durationMinutes);
  for (let i = 0; i < totalPoints; i++) {
    const minute = Math.round((i / (totalPoints - 1)) * durationMinutes);
    const cadenceVar = Math.round(targetCadence + (Math.sin(i * 0.7) * 7) + (Math.random() * 4 - 2));
    const speedVar = Number((targetSpeed + (Math.cos(i * 0.6) * 3) + (Math.random() * 2 - 1)).toFixed(1));
    points.push({
      time: `${minute}m`,
      cadence: Math.max(50, cadenceVar),
      speed: Math.max(12, speedVar)
    });
  }
  return points;
}

export function getStoredWorkouts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_WORKOUTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(INITIAL_WORKOUTS));
      return INITIAL_WORKOUTS;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading workouts', err);
    return INITIAL_WORKOUTS;
  }
}

export function saveWorkoutToStorage(workout) {
  try {
    const current = getStoredWorkouts();
    const updated = [workout, ...current];
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(updated));
    // Asynchronously sync with central server
    syncWorkoutsToServer(updated);
    return updated;
  } catch (err) {
    console.error('Error saving workout', err);
    return null;
  }
}

export function deleteWorkoutFromStorage(workoutId) {
  try {
    const current = getStoredWorkouts();
    const updated = current.filter(w => w.id !== workoutId);
    localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(updated));
    // Asynchronously sync with central server
    syncWorkoutsToServer(updated);
    return updated;
  } catch (err) {
    console.error('Error deleting workout', err);
    return null;
  }
}

export function resetWorkoutsToDefault() {
  localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(INITIAL_WORKOUTS));
  syncWorkoutsToServer(INITIAL_WORKOUTS);
  return INITIAL_WORKOUTS;
}

export const DEFAULT_SETTINGS = {
  mode: 'simulation', // 'simulation' | 'homeassistant'
  weightKg: 75,
  haUrl: 'https://ha.barrosoportal.com',
  haToken: '',
  cfClientId: '',
  cfClientSecret: '',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyAvscR3r1g4VGLbRpdKoC7DtB9Ezla_oac',
  haEntities: {
    cadence: 'sensor.merach_bike_cadence',
    speed: 'sensor.merach_bike_speed',
    power: '',
    resistance: '',
    heartRate: '',
    distance: '',
    calories: ''
  }
};

export function getStoredSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(data);
    const key = (parsed?.googleMapsApiKey === 'AIzaSyDYRazINJY0D57G8x5eKrmIY1MyaOypK1o' || !parsed?.googleMapsApiKey)
      ? DEFAULT_SETTINGS.googleMapsApiKey
      : parsed.googleMapsApiKey;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      googleMapsApiKey: key,
      haEntities: {
        ...DEFAULT_SETTINGS.haEntities,
        ...(parsed?.haEntities || {})
      }
    };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    // Asynchronously sync to central server so all other devices receive it
    syncSettingsToServer(settings);
    return settings;
  } catch (err) {
    console.error('Error saving settings', err);
    return settings;
  }
}

// ==========================================
// CENTRAL SERVER SYNC (Unraid / Docker API)
// ==========================================

async function syncSettingsToServer(settings) {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
  } catch {
    // Graceful fallback for local dev or offline mode
  }
}

async function syncWorkoutsToServer(workouts) {
  try {
    await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workouts)
    });
  } catch {
    // Graceful fallback
  }
}

export async function fetchServerSettings() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return null;
    const serverSettings = await res.json();
    if (serverSettings && typeof serverSettings === 'object' && Object.keys(serverSettings).length > 0) {
      const local = getStoredSettings();
      // Server values take precedence (central single source of truth)
      const merged = {
        ...local,
        ...serverSettings,
        haEntities: {
          ...local.haEntities,
          ...(serverSettings.haEntities || {})
        }
      };
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(merged));
      return merged;
    }
    // If server has no settings yet, push local settings to server
    const current = getStoredSettings();
    if (current.haToken) {
      syncSettingsToServer(current);
    }
    return current;
  } catch {
    return null;
  }
}

export async function fetchServerWorkouts() {
  try {
    const res = await fetch('/api/workouts');
    if (!res.ok) return null;
    const serverWorkouts = await res.json();
    if (Array.isArray(serverWorkouts) && serverWorkouts.length > 0) {
      localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(serverWorkouts));
      return serverWorkouts;
    }
    // If server is empty, initialize server with local workouts
    const local = getStoredWorkouts();
    if (Array.isArray(local) && local.length > 0) {
      syncWorkoutsToServer(local);
    }
    return local;
  } catch {
    return null;
  }
}
