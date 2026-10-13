import React, { useState } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume1, Volume2, VolumeX,
  Music2, X, Plus, Trash2, Smartphone, ExternalLink
} from 'lucide-react';

const SPOTIFY_GREEN = '#1DB954';

function fmt(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function Cover({ src, size, rounded = 'rounded-xl' }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <span className={`shrink-0 ${rounded} flex items-center justify-center bg-white/[0.06] ring-1 ring-white/10`} style={{ width: size, height: size }}>
        <Music2 className="text-slate-500" style={{ width: size * 0.4, height: size * 0.4 }} />
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className={`shrink-0 ${rounded} object-cover ring-1 ring-white/15 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.9)]`}
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

function RoundButton({ onClick, children, primary = false, active = false, title, size = 36, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`relative shrink-0 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 cursor-pointer ${
        primary ? 'text-slate-950' : active ? 'text-[#1DB954]' : 'text-slate-200 hover:text-white'
      }`}
      style={{
        width: size,
        height: size,
        background: primary
          ? `linear-gradient(180deg, #3be477 0%, ${SPOTIFY_GREEN} 55%, #128a3e 100%)`
          : 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
        boxShadow: primary
          ? `inset 0 1.5px 0 rgba(255,255,255,0.6), inset 0 -2px 3px rgba(255,255,255,0.25), 0 8px 18px -6px ${SPOTIFY_GREEN}`
          : 'inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(255,255,255,0.08)'
      }}
    >
      {children}
    </button>
  );
}

/** Compact strip inside the timer card (only rendered while something is playing/paused). */
export function SpotifyStrip({ spotify, onOpen }) {
  if (!spotify?.available || !spotify.hasMedia || !['playing', 'paused'].includes(spotify.status)) return null;
  const pct = spotify.duration ? (spotify.position / spotify.duration) * 100 : 0;

  return (
    <div
      className="relative w-full flex items-center gap-3 pl-2 pr-2.5 py-2 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(29,185,84,0.16) 0%, rgba(255,255,255,0.03) 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px rgba(29,185,84,0.25)'
      }}
    >
      <button type="button" onClick={onOpen} className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer" title="Abrir leitor Spotify">
        <Cover src={spotify.cover} size={38} rounded="rounded-lg" />
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold text-white truncate">{spotify.title}</span>
          <span className="block text-[11px] text-slate-400 truncate">{spotify.artist}</span>
        </span>
      </button>
      <div className="flex items-center gap-1.5">
        <RoundButton onClick={spotify.actions.previous} title="Anterior" size={32}><SkipBack className="w-3.5 h-3.5 fill-current" /></RoundButton>
        <RoundButton onClick={spotify.actions.toggle} primary title={spotify.isPlaying ? 'Pausar música' : 'Tocar música'} size={36}>
          {spotify.isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </RoundButton>
        <RoundButton onClick={spotify.actions.next} title="Seguinte" size={32}><SkipForward className="w-3.5 h-3.5 fill-current" /></RoundButton>
      </div>
      {/* Progress */}
      <span className="absolute left-0 bottom-0 h-[2px] bg-white/10 w-full" />
      <span className="absolute left-0 bottom-0 h-[2px] transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%`, background: SPOTIFY_GREEN, boxShadow: `0 0 6px ${SPOTIFY_GREEN}` }} />
    </div>
  );
}

/** Navbar button that opens the full player. */
export function SpotifyNavButton({ spotify, onOpen, className = '' }) {
  if (!spotify?.available) return null;
  return (
    <button type="button" onClick={onOpen} className={`${className} relative w-9`} title="Música (Spotify)">
      <Music2 className="w-4 h-4" style={{ color: spotify.isPlaying ? SPOTIFY_GREEN : undefined }} />
      {spotify.isPlaying && (
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: SPOTIFY_GREEN, boxShadow: `0 0 6px ${SPOTIFY_GREEN}` }} />
      )}
    </button>
  );
}

/** Full player panel. */
export function SpotifyPanel({ spotify, isOpen, onClose }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState(null);

  if (!isOpen || !spotify) return null;
  const { actions } = spotify;
  const pct = spotify.duration ? (spotify.position / spotify.duration) * 100 : 0;
  const VolumeIcon = spotify.volume === 0 ? VolumeX : (spotify.volume ?? 0) < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = spotify.repeat === 'one' ? Repeat1 : Repeat;

  const submitShortcut = () => {
    if (!actions.addShortcut(name, link)) {
      setLinkError('Link inválido. Copia o link de uma playlist, álbum ou música no Spotify.');
      return;
    }
    setName(''); setLink(''); setLinkError(null); setAdding(false);
  };

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center px-5 animate-[motivation-fade_0.25s_ease-out_both]" onClick={onClose}>
      <div className="absolute inset-0 bg-[#03060c]/70 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-[460px] max-h-[94vh] overflow-y-auto rounded-[30px] p-px animate-[motivation-in_0.45s_cubic-bezier(0.2,0.9,0.3,1.15)_both]"
        style={{
          background: `linear-gradient(160deg, rgba(255,255,255,0.4), rgba(255,255,255,0.06) 40%, ${SPOTIFY_GREEN}66)`,
          boxShadow: `0 40px 90px -30px rgba(0,0,0,0.95), 0 0 80px -40px ${SPOTIFY_GREEN}`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative rounded-[29px] px-6 pt-6 pb-5 overflow-hidden" style={{ background: 'linear-gradient(180deg, #13261c 0%, #0b1410 40%, #070b0a 100%)' }}>
          {/* Ambient cover glow */}
          {spotify.cover && (
            <img src={spotify.cover} alt="" className="absolute -top-24 left-1/2 -translate-x-1/2 w-[140%] max-w-none opacity-25 blur-3xl pointer-events-none" />
          )}

          <div className="relative flex items-center justify-between">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: SPOTIFY_GREEN }}>
              <Music2 className="w-4 h-4" /> Spotify
            </span>
            <button type="button" onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5" aria-label="Fechar">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Now playing */}
          <div className="relative mt-4 flex flex-col items-center text-center">
            <Cover src={spotify.cover} size={210} rounded="rounded-2xl" />
            <h3 className="mt-5 w-full text-xl font-bold tracking-tight text-white truncate">
              {spotify.hasMedia ? spotify.title : 'Nada a tocar'}
            </h3>
            <p className="w-full text-sm text-slate-300 truncate">
              {spotify.hasMedia ? spotify.artist : 'Escolhe uma lista abaixo ou toca no Spotify'}
            </p>
            {spotify.album && <p className="w-full text-[11px] text-slate-500 truncate">{spotify.album}</p>}
          </div>

          {/* Progress */}
          <div className="relative mt-5">
            <div className="h-[5px] rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%`, background: SPOTIFY_GREEN, boxShadow: `0 0 8px ${SPOTIFY_GREEN}` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-slate-500">
              <span>{fmt(spotify.position)}</span>
              <span>{fmt(spotify.duration)}</span>
            </div>
          </div>

          {/* Transport */}
          <div className="relative mt-3 flex items-center justify-center gap-4">
            <RoundButton onClick={() => actions.setShuffle(!spotify.shuffle)} active={spotify.shuffle} title="Aleatório" size={38}><Shuffle className="w-4 h-4" /></RoundButton>
            <RoundButton onClick={actions.previous} title="Anterior" size={46}><SkipBack className="w-5 h-5 fill-current" /></RoundButton>
            <RoundButton onClick={actions.toggle} primary title={spotify.isPlaying ? 'Pausar' : 'Tocar'} size={64}>
              {spotify.isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
            </RoundButton>
            <RoundButton onClick={actions.next} title="Seguinte" size={46}><SkipForward className="w-5 h-5 fill-current" /></RoundButton>
            <RoundButton onClick={actions.cycleRepeat} active={spotify.repeat !== 'off'} title="Repetir" size={38}><RepeatIcon className="w-4 h-4" /></RoundButton>
          </div>

          {/* Volume */}
          {spotify.volume !== null && (
            <div className="relative mt-5 flex items-center gap-3">
              <VolumeIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="range"
                min="0"
                max="100"
                defaultValue={Math.round(spotify.volume * 100)}
                key={Math.round(spotify.volume * 100)}
                // Send once when released (not on every drag step)
                onPointerUp={(e) => actions.setVolume(Number(e.target.value) / 100)}
                onKeyUp={(e) => actions.setVolume(Number(e.target.value) / 100)}
                className="flex-1 accent-[#1DB954] h-1.5"
                aria-label="Volume"
              />
              <span className="w-9 text-right text-[11px] tabular-nums text-slate-400">{Math.round(spotify.volume * 100)}%</span>
            </div>
          )}

          {/* Device */}
          <div className="relative mt-5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Tocar em</span>
            {spotify.sources.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {spotify.sources.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => actions.selectSource(src)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-semibold transition-all ${
                      spotify.source === src ? 'text-slate-950' : 'text-slate-200 bg-white/[0.06] ring-1 ring-white/10 hover:bg-white/10'
                    }`}
                    style={spotify.source === src ? { background: SPOTIFY_GREEN } : undefined}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> {src}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
                Nenhum aparelho ativo. Abre a app Spotify neste iPad (ou numa coluna) e toca uma música uma vez; depois passa a aparecer aqui.
              </p>
            )}
            <a href="spotify://" className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: SPOTIFY_GREEN }}>
              <ExternalLink className="w-3.5 h-3.5" /> Abrir app Spotify
            </a>
          </div>

          {/* Shortcuts */}
          <div className="relative mt-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Atalhos</span>
              {!adding && (
                <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1 text-[12px] font-semibold text-slate-300 hover:text-white">
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              )}
            </div>

            {spotify.shortcuts.length > 0 ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {spotify.shortcuts.map((sc) => (
                  <div key={sc.id} className="group relative flex items-center rounded-xl bg-white/[0.05] ring-1 ring-white/[0.08] hover:bg-white/[0.09]">
                    <button type="button" onClick={() => actions.playUri(sc)} className="flex-1 min-w-0 flex items-center gap-2 px-3 py-2.5 text-left">
                      <Play className="w-3.5 h-3.5 shrink-0 fill-current" style={{ color: SPOTIFY_GREEN }} />
                      <span className="truncate text-[13px] font-semibold text-white">{sc.name}</span>
                    </button>
                    <button type="button" onClick={() => actions.removeShortcut(sc.id)} className="p-2 text-slate-500 hover:text-rose-300" title="Remover atalho">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              !adding && <p className="mt-2 text-[12px] text-slate-500">Adiciona as tuas playlists de treino para as tocar com um toque.</p>
            )}

            {adding && (
              <div className="mt-2 space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome (ex: Treino Spin)"
                  className="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white bg-black/30 ring-1 ring-white/10 focus:ring-2 focus:ring-[#1DB954]/60 outline-none placeholder:text-slate-600"
                />
                <input
                  value={link}
                  onChange={(e) => { setLink(e.target.value); setLinkError(null); }}
                  placeholder="Link do Spotify (Partilhar → Copiar link)"
                  className="w-full rounded-xl px-3.5 py-2.5 text-[13px] text-white bg-black/30 ring-1 ring-white/10 focus:ring-2 focus:ring-[#1DB954]/60 outline-none placeholder:text-slate-600"
                />
                {linkError && <p className="text-[11px] text-rose-300">{linkError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setAdding(false); setLinkError(null); }} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-slate-300 bg-white/5 ring-1 ring-white/10">Cancelar</button>
                  <button type="button" onClick={submitShortcut} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-slate-950" style={{ background: SPOTIFY_GREEN }}>Guardar</button>
                </div>
              </div>
            )}
          </div>

          {spotify.error && (
            <p className="relative mt-4 text-[11px] leading-relaxed text-amber-300/90">
              Não foi possível executar o comando no Spotify. Confirma que há um aparelho ativo em "Tocar em". ({String(spotify.error).slice(0, 120)})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
