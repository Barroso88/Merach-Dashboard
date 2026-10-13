import React, { useRef, useState } from 'react';
import { Plus, X, Check, Trash2, Pencil, Camera } from 'lucide-react';
import { PROFILE_COLORS, nextProfileColor } from '../services/profileService';

function Avatar({ profile, size = 72, active = false }) {
  const initial = (profile.name || '?').trim().charAt(0).toUpperCase();
  return (
    <span
      className="relative rounded-full flex items-center justify-center font-bold text-white select-none"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(145deg, ${profile.color} 0%, ${profile.color}99 100%)`,
        boxShadow: active
          ? `0 0 0 3px #0a0f19, 0 0 0 5px ${profile.color}, 0 12px 30px -8px ${profile.color}`
          : `inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 24px -10px ${profile.color}`
      }}
    >
      {profile.photo ? (
        <img
          src={profile.photo}
          alt={profile.name}
          className="absolute inset-0 w-full h-full rounded-full object-cover"
          draggable={false}
        />
      ) : (
        initial
      )}
    </span>
  );
}

export { Avatar };

// Centre-crop to a square and downscale so profile photos stay small (~20–40 KB)
function resizeImageToDataUrl(file, size = 320) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      const sx = (img.naturalWidth - side) / 2;
      const sy = (img.naturalHeight - side) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível ler a imagem'));
    };
    img.src = url;
  });
}

function ProfileForm({ initial, onSubmit, onCancel, onDelete, canDelete, submitLabel }) {
  const [name, setName] = useState(initial.name || '');
  const [color, setColor] = useState(initial.color);
  const [theme, setTheme] = useState(initial.theme || 'cyan');
  const [photo, setPhoto] = useState(initial.photo || null);
  const [photoError, setPhotoError] = useState(null);
  const fileRef = useRef(null);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPhotoError(null);
      setPhoto(await resizeImageToDataUrl(file));
    } catch (err) {
      setPhotoError(err.message);
    }
  };
  const [confirmDelete, setConfirmDelete] = useState(false);
  const trimmed = name.trim();

  return (
    <div className="mt-6 rounded-2xl p-4 bg-white/[0.03] ring-1 ring-white/[0.07] text-left" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative shrink-0 rounded-full active:scale-95 transition-transform"
          title={photo ? 'Mudar foto' : 'Adicionar foto'}
        >
          <Avatar profile={{ name: trimmed || '?', color, photo }} size={64} />
          <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full flex items-center justify-center bg-white text-slate-900 ring-2 ring-[#0b1220] shadow">
            <Camera className="w-3.5 h-3.5" strokeWidth={2.4} />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        <input
          autoFocus
          value={name}
          maxLength={40}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && trimmed) onSubmit({ name: trimmed, color, theme, photo: photo || null }); }}
          placeholder="Nome"
          className="flex-1 min-w-0 rounded-xl px-4 py-3 text-base font-semibold text-white bg-black/30 ring-1 ring-white/10 focus:ring-2 focus:ring-sky-400/60 outline-none placeholder:text-slate-600"
        />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-slate-200 bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
        >
          <Camera className="w-3.5 h-3.5" />
          {photo ? 'Mudar foto' : 'Carregar foto'}
        </button>
        {photo && (
          <button
            type="button"
            onClick={() => setPhoto(null)}
            className="px-3 py-2 rounded-xl text-[12px] font-semibold text-rose-300 bg-rose-500/10 ring-1 ring-rose-400/25 hover:bg-rose-500/20"
          >
            Remover foto
          </button>
        )}
        {photoError && <span className="text-[11px] text-rose-300">{photoError}</span>}
      </div>

      <div className="mt-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Cor</span>
        <div className="mt-2 flex flex-wrap gap-2.5">
          {PROFILE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-90"
              style={{ background: c, boxShadow: color === c ? `0 0 0 2px #0a0f19, 0 0 0 4px ${c}` : 'inset 0 1px 0 rgba(255,255,255,0.3)' }}
              aria-label={`Cor ${c}`}
            >
              {color === c && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Tema</span>
        <div className="mt-2 inline-flex p-[3px] rounded-xl bg-black/30 ring-1 ring-white/[0.06]">
          {[
            { id: 'cyan', label: 'Cyber Cyan', dots: ['#38bdf8', '#34d399'] },
            { id: 'rose', label: 'Rosa & Violeta', dots: ['#ff2d75', '#9400D3'] }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[12px] font-medium transition-all ${
                theme === t.id ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]' : 'text-slate-400'
              }`}
            >
              <span className="flex -space-x-1">
                {t.dots.map((d) => <span key={d} className="w-3 h-3 rounded-full ring-2 ring-[#0b1018]" style={{ background: d }} />)}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        {canDelete && !confirmDelete && (
          <button type="button" onClick={() => setConfirmDelete(true)} className="p-3 rounded-xl text-rose-300 bg-rose-500/10 ring-1 ring-rose-400/25 hover:bg-rose-500/20" title="Apagar perfil">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {confirmDelete ? (
          <div className="flex-1 flex items-center gap-2">
            <span className="flex-1 text-[12px] text-rose-200">Apagar este perfil? Os treinos continuam visíveis em "Todos".</span>
            <button type="button" onClick={() => setConfirmDelete(false)} className="px-3 py-2.5 rounded-xl text-[12px] font-semibold text-slate-300 bg-white/5">Não</button>
            <button type="button" onClick={onDelete} className="px-3 py-2.5 rounded-xl text-[12px] font-semibold text-white bg-red-600">Apagar</button>
          </div>
        ) : (
          <>
            <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-slate-300 bg-white/5 ring-1 ring-white/10">Cancelar</button>
            <button
              type="button"
              disabled={!trimmed}
              onClick={() => onSubmit({ name: trimmed, color, theme, photo: photo || null })}
              className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40 transition-opacity"
              style={{ background: `linear-gradient(160deg, ${color}, ${color}aa)`, boxShadow: `0 10px 24px -12px ${color}` }}
            >
              {submitLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * mode 'pick'   → "Quem vai pedalar?" before starting a workout
 * mode 'manage' → switch / add / edit / delete profiles
 */
export default function ProfilesModal({
  isOpen,
  mode = 'pick',
  profiles = [],
  activeId,
  workoutCounts = {},
  onPick,
  onChangeProfiles,
  onClose
}) {
  const [editing, setEditing] = useState(null); // null | 'new' | profileId

  if (!isOpen) return null;

  const close = () => { setEditing(null); onClose?.(); };

  const handleCreate = (fields) => {
    const profile = { id: `p-${Date.now()}`, ...fields, createdAt: new Date().toISOString() };
    onChangeProfiles([...profiles, profile]);
    setEditing(null);
    if (mode === 'pick') onPick(profile.id, profile);
  };

  const handleUpdate = (id, fields) => {
    onChangeProfiles(profiles.map(p => (p.id === id ? { ...p, ...fields } : p)));
    setEditing(null);
  };

  const handleDelete = (id) => {
    onChangeProfiles(profiles.filter(p => p.id !== id));
    setEditing(null);
  };

  const editingProfile = editing && editing !== 'new' ? profiles.find(p => p.id === editing) : null;

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center px-5 animate-[motivation-fade_0.25s_ease-out_both]" onClick={close}>
      <div className="absolute inset-0 bg-[#03060c]/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-[560px] max-h-[92vh] overflow-y-auto rounded-[30px] p-px animate-[motivation-in_0.45s_cubic-bezier(0.2,0.9,0.3,1.15)_both]"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.08))',
          boxShadow: '0 40px 90px -30px rgba(0,0,0,0.95)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-[29px] px-6 pt-7 pb-6 text-center" style={{ background: 'linear-gradient(180deg, #111a2a 0%, #080d16 100%)' }}>
          <button type="button" onClick={close} className="absolute top-4 right-4 p-2 rounded-full text-slate-500 hover:text-white hover:bg-white/5" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>

          <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-slate-500">
            {mode === 'pick' ? 'Antes de começar' : 'Perfis'}
          </span>
          <h2 className="mt-1.5 text-[1.7rem] font-bold tracking-tight text-white">
            {mode === 'pick' ? 'Quem vai pedalar?' : 'Gerir perfis'}
          </h2>

          <div className="mt-6 grid grid-cols-3 sm:grid-cols-4 gap-4 justify-items-center">
            {profiles.map((p) => (
              <div key={p.id} className="relative flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => (mode === 'pick' ? onPick(p.id, p) : onPick?.(p.id, p))}
                  className="group flex flex-col items-center gap-2 transition-transform active:scale-95"
                >
                  <Avatar profile={p} size={76} active={p.id === activeId} />
                  <span className="max-w-[96px] truncate text-[14px] font-semibold text-white">{p.name}</span>
                  <span className="text-[10px] font-medium text-slate-500 tabular-nums">
                    {workoutCounts[p.id] || 0} {workoutCounts[p.id] === 1 ? 'treino' : 'treinos'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(p.id)}
                  className="absolute top-0 -right-1 w-7 h-7 rounded-full flex items-center justify-center bg-[#0b1220] ring-1 ring-white/15 text-slate-300 hover:text-white"
                  title="Editar perfil"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add profile */}
            <button type="button" onClick={() => setEditing('new')} className="flex flex-col items-center gap-2 active:scale-95 transition-transform">
              <span className="w-[76px] h-[76px] rounded-full flex items-center justify-center text-slate-400 border-2 border-dashed border-white/15 bg-white/[0.03] hover:text-white hover:border-white/30">
                <Plus className="w-7 h-7" />
              </span>
              <span className="text-[14px] font-semibold text-slate-400">Novo perfil</span>
            </button>
          </div>

          {editing === 'new' && (
            <ProfileForm
              key="new"
              initial={{ name: '', color: nextProfileColor(profiles), theme: 'cyan' }}
              submitLabel={mode === 'pick' ? 'Criar e começar' : 'Criar perfil'}
              onSubmit={handleCreate}
              onCancel={() => setEditing(null)}
            />
          )}
          {editingProfile && (
            <ProfileForm
              key={editingProfile.id}
              initial={editingProfile}
              submitLabel="Guardar"
              canDelete={profiles.length > 1}
              onSubmit={(fields) => handleUpdate(editingProfile.id, fields)}
              onDelete={() => handleDelete(editingProfile.id)}
              onCancel={() => setEditing(null)}
            />
          )}

          {mode === 'pick' && !editing && (
            <p className="mt-6 text-[11px] text-slate-500">Toca no teu perfil para iniciar o treino</p>
          )}
        </div>
      </div>
    </div>
  );
}
