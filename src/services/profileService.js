// Rider profiles: shared across devices via /api/profiles; the active profile is per device.

const STORAGE_KEY_PROFILES = 'merach_profiles_v1';
const STORAGE_KEY_ACTIVE = 'merach_active_profile';

export const PROFILE_COLORS = ['#ff2d75', '#38bdf8', '#34d399', '#facc15', '#fb923c', '#a78bfa', '#f43f5e', '#a3e635'];

// Workouts recorded before profiles existed belong to this first profile
const FIRST_PROFILE = { id: 'p-nayara', name: 'Nayara', color: '#ff2d75' };

function seedProfiles() {
  let theme = 'cyan';
  try {
    theme = localStorage.getItem('merach_theme') === 'rose' ? 'rose' : 'cyan';
  } catch {
    // ignore
  }
  return {
    profiles: [{ ...FIRST_PROFILE, theme, createdAt: new Date().toISOString() }],
    legacyProfileId: FIRST_PROFILE.id
  };
}

function isValid(data) {
  return data && Array.isArray(data.profiles) && data.profiles.length > 0;
}

export function getStoredProfiles() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY_PROFILES) || 'null');
    if (isValid(parsed)) return parsed;
  } catch {
    // fall through to seed
  }
  const seeded = seedProfiles();
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(seeded));
  } catch {
    // ignore
  }
  return seeded;
}

async function pushProfilesToServer(data) {
  try {
    await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  } catch {
    // offline / local dev
  }
}

export function saveProfiles(data) {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(data));
  } catch {
    // ignore
  }
  pushProfilesToServer(data);
  return data;
}

// Server is the source of truth; if it has no profiles yet, publish the local (seeded) ones
export async function fetchServerProfiles() {
  try {
    const res = await fetch('/api/profiles');
    if (!res.ok) return null;
    const data = await res.json();
    if (isValid(data)) {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(data));
      return data;
    }
    const local = getStoredProfiles();
    pushProfilesToServer(local);
    return local;
  } catch {
    return null;
  }
}

export function getActiveProfileId() {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE);
  } catch {
    return null;
  }
}

export function setActiveProfileId(id) {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE, id);
  } catch {
    // ignore
  }
}

export function workoutOwnerId(workout, legacyProfileId) {
  return workout?.profileId || legacyProfileId || null;
}

export function nextProfileColor(profiles) {
  const used = new Set(profiles.map(p => p.color));
  return PROFILE_COLORS.find(c => !used.has(c)) || PROFILE_COLORS[profiles.length % PROFILE_COLORS.length];
}
