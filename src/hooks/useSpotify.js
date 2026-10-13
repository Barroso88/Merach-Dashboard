import { useCallback, useEffect, useRef, useState } from 'react';

const POLL_MS = 3000;
const SHORTCUTS_KEY = 'merach_spotify_shortcuts_v1';
const DEVICE_KEY = 'merach_spotify_device';

// HA media_player feature bits
const FEATURE_PAUSE = 1;
const FEATURE_PLAY = 16384;

function rememberDevice(name) {
  try { localStorage.setItem(DEVICE_KEY, name); } catch { /* ignore */ }
}
function preferredDevice() {
  try { return localStorage.getItem(DEVICE_KEY); } catch { return null; }
}

// Turn HA / Spotify errors into something actionable
function friendlyError(message = '') {
  if (/does not support action/i.test(message)) return 'O Spotify não tem nenhum aparelho ativo. Escolhe um em "Tocar em" ou abre a app Spotify no iPad.';
  if (/no active device|NO_ACTIVE_DEVICE|404/i.test(message)) return 'Nenhum aparelho Spotify ativo. Abre a app Spotify no iPad e toca uma música uma vez.';
  if (/premium/i.test(message)) return 'O controlo do Spotify exige uma conta Premium.';
  return message || 'Falha ao comunicar com o Spotify';
}

// Accepts open.spotify.com links or spotify: URIs for playlists, albums, tracks and artists
export function toSpotifyUri(input) {
  const text = (input || '').trim();
  const uri = text.match(/^spotify:(playlist|album|track|artist):([A-Za-z0-9]+)$/);
  if (uri) return { uri: text, type: uri[1] };
  const url = text.match(/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(playlist|album|track|artist)\/([A-Za-z0-9]+)/i);
  if (url) return { uri: `spotify:${url[1].toLowerCase()}:${url[2]}`, type: url[1].toLowerCase() };
  return null;
}

function loadShortcuts() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SHORTCUTS_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Spotify via the Home Assistant Spotify integration.
 * Polls the media_player state while the page is visible and exposes playback actions.
 */
export default function useSpotify(haService, enabled) {
  const [entityId, setEntityId] = useState(null);
  const [state, setState] = useState(null); // HA state object
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [shortcuts, setShortcuts] = useState(loadShortcuts);
  const entityRef = useRef(null);

  // Discover the Spotify media player once HA is configured
  useEffect(() => {
    if (!enabled || !haService) return undefined;
    let cancelled = false;
    let retry;
    const discover = () => {
      haService.findSpotifyEntity()
        .then((id) => {
          if (cancelled) return;
          if (id) {
            entityRef.current = id;
            setEntityId(id);
          } else {
            retry = setTimeout(discover, 30000);
          }
        })
        .catch(() => { if (!cancelled) retry = setTimeout(discover, 30000); });
    };
    discover();
    return () => { cancelled = true; clearTimeout(retry); };
  }, [enabled, haService]);

  const refresh = useCallback(async () => {
    const id = entityRef.current;
    if (!id || !haService) return;
    try {
      const next = await haService.getEntityState(id);
      setState(next);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, [haService]);

  // Poll while visible
  useEffect(() => {
    if (!entityId) return undefined;
    refresh();
    const timer = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [entityId, refresh]);

  // Smooth progress bar between polls while playing
  const isPlaying = state?.state === 'playing';
  useEffect(() => {
    if (!isPlaying) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [isPlaying]);

  // When nothing is playing, the HA Spotify entity only supports SELECT_SOURCE.
  // Activate a device (last used, or the first available) and wait until playback controls appear.
  const ensureActiveDevice = useCallback(async () => {
    const id = entityRef.current;
    let current = await haService.getEntityState(id);
    const features = Number(current.attributes?.supported_features || 0);
    if (features & FEATURE_PLAY || features & FEATURE_PAUSE) return true;

    const sources = current.attributes?.source_list || [];
    if (!sources.length) {
      throw new Error('Nenhum aparelho Spotify disponível. Abre a app Spotify no iPad (ou numa coluna) e volta a tentar.');
    }
    const wanted = preferredDevice();
    const device = sources.includes(wanted) ? wanted : (current.attributes?.source && sources.includes(current.attributes.source) ? current.attributes.source : sources[0]);
    await haService.callService('media_player', 'select_source', { entity_id: id, source: device });

    for (let i = 0; i < 10; i++) {
      await new Promise(r => setTimeout(r, 700));
      current = await haService.getEntityState(id);
      const f = Number(current.attributes?.supported_features || 0);
      if (f & FEATURE_PLAY || f & FEATURE_PAUSE) {
        setState(current);
        return true;
      }
    }
    throw new Error(`O aparelho "${device}" não ficou ativo. Abre a app Spotify nesse aparelho e volta a tentar.`);
  }, [haService]);

  const call = useCallback(async (service, data = {}, { activate = false } = {}) => {
    const id = entityRef.current;
    if (!id) return;
    setBusy(true);
    try {
      if (activate) await ensureActiveDevice();
      await haService.callService('media_player', service, { entity_id: id, ...data });
      setError(null);
      setTimeout(refresh, 500);
    } catch (err) {
      setError(friendlyError(err.message));
    } finally {
      setBusy(false);
    }
  }, [haService, refresh, ensureActiveDevice]);

  const attrs = state?.attributes || {};
  const duration = Number(attrs.media_duration || 0);
  let position = Number(attrs.media_position || 0);
  if (isPlaying && attrs.media_position_updated_at) {
    position += (now - new Date(attrs.media_position_updated_at).getTime()) / 1000;
  }
  position = Math.max(0, duration ? Math.min(duration, position) : position);

  const features = Number(attrs.supported_features || 0);
  const canControl = Boolean(features & FEATURE_PLAY || features & FEATURE_PAUSE);

  const saveShortcuts = (list) => {
    setShortcuts(list);
    try {
      localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  return {
    available: Boolean(entityId),
    entityId,
    status: state?.state || (entityId ? 'loading' : 'unavailable'), // playing | paused | idle | off | unavailable
    isPlaying,
    hasMedia: Boolean(attrs.media_title),
    title: attrs.media_title || '',
    artist: attrs.media_artist || '',
    album: attrs.media_album_name || '',
    cover: haService?.resolveMediaUrl(attrs.entity_picture) || null,
    duration,
    position,
    volume: typeof attrs.volume_level === 'number' ? attrs.volume_level : null,
    shuffle: Boolean(attrs.shuffle),
    repeat: attrs.repeat || 'off',
    source: attrs.source || null,
    sources: Array.isArray(attrs.source_list) ? attrs.source_list : [],
    canControl,
    error,
    busy,
    shortcuts,
    actions: {
      play: () => call('media_play', {}, { activate: true }),
      pause: () => call('media_pause'),
      toggle: () => (isPlaying ? call('media_pause') : call('media_play', {}, { activate: true })),
      next: () => call('media_next_track', {}, { activate: true }),
      previous: () => call('media_previous_track', {}, { activate: true }),
      setVolume: (v) => call('volume_set', { volume_level: Math.max(0, Math.min(1, v)) }),
      setShuffle: (on) => call('shuffle_set', { shuffle: on }),
      cycleRepeat: () => call('repeat_set', { repeat: { off: 'all', all: 'one', one: 'off' }[attrs.repeat || 'off'] || 'off' }),
      selectSource: (source) => { rememberDevice(source); return call('select_source', { source }); },
      playUri: ({ uri, type }) => call('play_media', { media_content_id: uri, media_content_type: type === 'track' ? 'music' : type }, { activate: true }),
      addShortcut: (name, link) => {
        const parsed = toSpotifyUri(link);
        if (!parsed) return false;
        saveShortcuts([...shortcuts, { id: `s-${Date.now()}`, name: name.trim() || 'Lista', ...parsed }]);
        return true;
      },
      removeShortcut: (id) => saveShortcuts(shortcuts.filter(s => s.id !== id)),
      refresh
    }
  };
}
