// LocalStorage Service for Official Merach Workout History & Settings

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
    maxSpeed: 30.1,
    distanceKm: 10.8,
    caloriesKcal: 195,
    avgResistance: 8,
    notes: 'Giro leve e descontraído.',
    samples: generateMockSessionSamples(25, 92, 26.0)
  },
  {
    id: 'wo-5',
    title: 'Treino Intervalado Rápido',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 2400, // 40 min
    avgCadence: 88,
    maxCadence: 108,
    avgSpeed: 33.2,
    maxSpeed: 42.0,
    distanceKm: 22.1,
    caloriesKcal: 490,
    avgResistance: 15,
    notes: 'Acelerações fortes a cada 5 minutos.',
    samples: generateMockSessionSamples(40, 88, 33.2)
  },
  {
    id: 'wo-6',
    title: 'Endurance de Longa Duração',
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    durationSeconds: 3600, // 60 min
    avgCadence: 84,
    maxCadence: 96,
    avgSpeed: 29.5,
    maxSpeed: 36.8,
    distanceKm: 29.5,
    caloriesKcal: 610,
    avgResistance: 13,
    notes: '1 hora contínua de pedalada.',
    samples: generateMockSessionSamples(60, 84, 29.5)
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
    return updated;
  } catch (err) {
    console.error('Error deleting workout', err);
    return null;
  }
}

export function resetWorkoutsToDefault() {
  localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(INITIAL_WORKOUTS));
  return INITIAL_WORKOUTS;
}

export const DEFAULT_SETTINGS = {
  mode: 'simulation', // 'simulation' | 'homeassistant'
  weightKg: 75,
  haUrl: 'https://ha.barrosoportal.com',
  haToken: '',
  cfClientId: '',
  cfClientSecret: '',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDYRazINJY0D57G8x5eKrmIY1MyaOypK1o',
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
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
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
    return settings;
  } catch (err) {
    console.error('Error saving settings', err);
    return settings;
  }
}
