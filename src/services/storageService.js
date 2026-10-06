// LocalStorage & Server Sync Service for Official Merach Workout History & Settings

const STORAGE_KEY_WORKOUTS = 'merach_official_workouts_v2';
const STORAGE_KEY_SETTINGS = 'merach_official_settings_v2';

// No test mock workouts: user workouts history starts completely clean
const INITIAL_WORKOUTS = [];

export function getStoredWorkouts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY_WORKOUTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(data);
    // Purge previous test/demo mock records if present in browser localStorage
    const cleaned = Array.isArray(parsed)
      ? parsed.filter(w => !['wo-1', 'wo-2', 'wo-3', 'wo-4', 'wo-5', 'wo-6', 'wo-7'].includes(w.id))
      : [];
    if (Array.isArray(parsed) && cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(cleaned));
      syncWorkoutsToServer(cleaned);
    }
    return cleaned;
  } catch (err) {
    console.error('Error reading workouts', err);
    return [];
  }
}

export function saveWorkoutToStorage(workout) {
  try {
    const current = getStoredWorkouts();
    const index = current.findIndex(w => w.id === workout.id);
    let updated;
    if (index >= 0) {
      updated = [...current];
      updated[index] = { ...current[index], ...workout };
    } else {
      updated = [workout, ...current];
    }
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
  mode: 'homeassistant', // 'homeassistant' | 'simulation'
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
  },
  postgresConfig: {
    host: '',
    port: 5432,
    user: 'postgres',
    password: '',
    database: 'merach'
  },
  keepScreenAwake: true,
  preventBackgroundSuspension: true
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

    // Automatically use homeassistant mode if a token or entities exist
    const resolvedMode = parsed?.mode || (parsed?.haToken ? 'homeassistant' : DEFAULT_SETTINGS.mode);

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      mode: resolvedMode,
      googleMapsApiKey: key,
      haEntities: {
        ...DEFAULT_SETTINGS.haEntities,
        ...(parsed?.haEntities || {})
      },
      postgresConfig: {
        ...DEFAULT_SETTINGS.postgresConfig,
        ...(parsed?.postgresConfig || {})
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
    if (Array.isArray(serverWorkouts)) {
      const cleaned = serverWorkouts.filter(w => !['wo-1', 'wo-2', 'wo-3', 'wo-4', 'wo-5', 'wo-6', 'wo-7'].includes(w.id));
      localStorage.setItem(STORAGE_KEY_WORKOUTS, JSON.stringify(cleaned));
      if (cleaned.length !== serverWorkouts.length) {
        syncWorkoutsToServer(cleaned);
      }
      return cleaned;
    }
    const local = getStoredWorkouts();
    return local;
  } catch {
    return null;
  }
}
