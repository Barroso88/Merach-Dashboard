import { useCallback, useEffect, useRef, useState } from 'react';

const POLL_MS = 3000;
const SHORTCUTS_KEY = 'merach_spotify_shortcuts_v1';

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
    haService.findSpotifyEntity()
      .then((id) => {
        if (cancelled) return;
        entityRef.current = id;
        setEntityId(id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
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

  const call = useCallback(async (service, data = {}) => {
    const id = entityRef.current;
    if (!id) return;
    setBusy(true);
    try {
      await haService.callService('media_player', service, { entity_id: id, ...data });
      setError(null);
      setTimeout(refresh, 400);
    } catch (err) {
      setError(err.message || 'Falha ao comunicar com o Spotify');
    } finally {
      setBusy(false);
    }
  }, [haService, refresh]);

  const attrs = state?.attributes || {};
  const duration = Number(attrs.media_duration || 0);
  let position = Number(attrs.media_position || 0);
  if (isPlaying && attrs.media_position_updated_at) {
    position += (now - new Date(attrs.media_position_updated_at).getTime()) / 1000;
  }
  position = Math.max(0, duration ? Math.min(duration, position) : position);

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
    error,
    busy,
    shortcuts,
    actions: {
      play: () => call('media_play'),
      pause: () => call('media_pause'),
      toggle: () => call(isPlaying ? 'media_pause' : 'media_play'),
      next: () => call('media_next_track'),
      previous: () => call('media_previous_track'),
      setVolume: (v) => call('volume_set', { volume_level: Math.max(0, Math.min(1, v)) }),
      setShuffle: (on) => call('shuffle_set', { shuffle: on }),
      cycleRepeat: () => call('repeat_set', { repeat: { off: 'all', all: 'one', one: 'off' }[attrs.repeat || 'off'] || 'off' }),
      selectSource: (source) => call('select_source', { source }),
      playUri: ({ uri, type }) => call('play_media', { media_content_id: uri, media_content_type: type === 'track' ? 'music' : type }),
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
