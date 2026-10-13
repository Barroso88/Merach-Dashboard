import React, { useEffect, useRef, useState } from 'react';
import { Flame, X } from 'lucide-react';
import { playBeep } from '../utils/audio';

const INTERVAL_SECONDS = 300; // every 5 minutes of riding
const VISIBLE_MS = 7000;

const GENERIC_MESSAGES = [
  { title: 'Grande arranque!', body: 'Os primeiros 5 minutos estão feitos. O corpo já aqueceu — agora é rolar.' },
  { title: 'Estás a voar!', body: 'Mantém a respiração controlada e os ombros relaxados.' },
  { title: 'Ritmo de campeão!', body: 'Cada pedalada conta. Continua assim.' },
  { title: 'Não pares agora!', body: 'A consistência vence a intensidade. Segura este ritmo.' },
  { title: 'Força nas pernas!', body: 'Estás mais forte do que quando começaste.' },
  { title: 'Modo máquina ativado', body: 'Hidrata-te e continua a empurrar.' },
  { title: 'Isto é disciplina!', body: 'A maioria já tinha parado. Tu não.' },
  { title: 'Lenda em construção', body: 'Mais 5 minutos no bolso. Vamos ao próximo bloco!' }
];

function buildMessage({ milestone, elapsedSeconds, targetSeconds, sessionStats }) {
  const minutes = Math.round(elapsedSeconds / 60);
  const avgCadence = Number(sessionStats?.avgCadence || 0);

  if (targetSeconds > 0) {
    const remainingMin = Math.max(0, Math.round((targetSeconds - elapsedSeconds) / 60));
    const ratio = elapsedSeconds / targetSeconds;
    if (Math.abs(ratio - 0.5) <= INTERVAL_SECONDS / targetSeconds / 2) {
      return { title: 'A meio caminho!', body: `Metade do treino concluída. Faltam ${remainingMin} min — tu consegues!` };
    }
    if (remainingMin <= 5) {
      return { title: 'Reta final!', body: `Só faltam ${remainingMin} min. Dá tudo o que tens!` };
    }
    if (ratio >= 0.75) {
      return { title: 'Quase lá!', body: `Já fizeste ${minutes} min. Faltam apenas ${remainingMin} min para a meta.` };
    }
  }

  // Every third milestone, give a cadence tip when it is clearly off the 80–95 RPM sweet spot
  if (milestone % 3 === 2 && avgCadence > 0) {
    if (avgCadence < 70) {
      return { title: 'Sobe a cadência!', body: `Média de ${avgCadence.toFixed(0)} RPM. Tenta rodar entre 80 e 95 RPM com menos resistência.` };
    }
    if (avgCadence >= 80 && avgCadence <= 95) {
      return { title: 'Cadência perfeita!', body: `${avgCadence.toFixed(0)} RPM de média — mesmo na zona ideal. Excelente!` };
    }
  }

  return GENERIC_MESSAGES[(milestone - 1) % GENERIC_MESSAGES.length];
}

function playChime() {
  playBeep(660, 0.14, 'sine');
  setTimeout(() => playBeep(880, 0.22, 'sine'), 140);
}

export default function MotivationalPopup({
  workoutStatus,
  elapsedSeconds = 0,
  targetSeconds = 0,
  sessionStats,
  themeConfig
}) {
  const [popup, setPopup] = useState(null);
  const lastMilestoneRef = useRef(0);
  const hideTimerRef = useRef(null);

  // Detect each new 5-minute milestone while riding
  useEffect(() => {
    const milestone = Math.floor(elapsedSeconds / INTERVAL_SECONDS);

    // New workout (timer back to zero): start counting again
    if (milestone < lastMilestoneRef.current) {
      lastMilestoneRef.current = milestone;
      return;
    }
    if (workoutStatus !== 'running' || milestone === 0 || milestone === lastMilestoneRef.current) return;

    lastMilestoneRef.current = milestone;

    // The goal-reached celebration already covers the end of a timed workout
    if (targetSeconds > 0 && elapsedSeconds >= targetSeconds) return;

    const message = buildMessage({ milestone, elapsedSeconds, targetSeconds, sessionStats });
    setPopup({
      id: milestone,
      minutes: Math.round((milestone * INTERVAL_SECONDS) / 60),
      ...message,
      distanceKm: Number(sessionStats?.distanceKm || 0),
      avgSpeed: Number(sessionStats?.avgSpeed || 0),
      avgCadence: Number(sessionStats?.avgCadence || 0)
    });
    playChime();

    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setPopup(null), VISIBLE_MS);
  }, [elapsedSeconds, workoutStatus, targetSeconds, sessionStats]);

  useEffect(() => () => clearTimeout(hideTimerRef.current), []);

  // Never show over the idle screen (e.g. right after finishing a workout)
  if (!popup || workoutStatus === 'idle') return null;

  const isRose = themeConfig?.id === 'rose';
  const accent = isRose ? '#ff2d75' : '#38bdf8';
  const accent2 = isRose ? '#d946ef' : '#34d399';

  return (
    // Centred overlay above everything; any tap dismisses it so it never blocks the controls for long
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center px-6 animate-[motivation-fade_0.35s_ease-out_both]"
      onClick={() => setPopup(null)}
      role="status"
      aria-live="polite"
    >
      {/* Dim + blur the cockpit behind */}
      <div className="absolute inset-0 bg-[#03060c]/55 backdrop-blur-[3px]" />

      <div
        key={popup.id}
        className="relative w-full max-w-[440px] rounded-[30px] p-px cursor-pointer animate-[motivation-in_0.6s_cubic-bezier(0.2,0.9,0.3,1.15)_both]"
        style={{
          background: `linear-gradient(160deg, ${accent} 0%, rgba(255,255,255,0.08) 35%, rgba(255,255,255,0.05) 65%, ${accent2} 100%)`,
          boxShadow: `0 40px 90px -30px rgba(0,0,0,0.95), 0 0 90px -20px ${accent}99`
        }}
      >
        <div
          className="relative rounded-[29px] overflow-hidden px-7 pt-8 pb-6 text-center"
          style={{
            background: isRose
              ? 'linear-gradient(180deg, #24082d 0%, #12041a 100%)'
              : 'linear-gradient(180deg, #111a2a 0%, #080d16 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)'
          }}
        >
          {/* Ambient light */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ background: accent }} />

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPopup(null); }}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Minute medallion */}
          <div className="relative mx-auto w-24 h-24">
            <span className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: accent }} />
            <div
              className="relative w-24 h-24 rounded-full p-[2px]"
              style={{ background: `conic-gradient(from 200deg, ${accent}, ${accent2}, ${accent})`, boxShadow: `0 0 40px -6px ${accent}` }}
            >
              <div className="w-full h-full rounded-full flex flex-col items-center justify-center bg-[#070b12] shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
                <span className="text-[2.6rem] font-bold tabular-nums tracking-tight leading-none text-white">{popup.minutes}</span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: accent }}>min</span>
              </div>
            </div>
          </div>

          <div className="relative mt-5 flex items-center justify-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            <h3 className="text-[1.6rem] font-bold tracking-tight text-white">{popup.title}</h3>
          </div>
          <p className="relative mt-2 text-[15px] leading-relaxed text-slate-300 max-w-[340px] mx-auto">{popup.body}</p>

          {/* Stats so far */}
          <div className="relative mt-6 grid grid-cols-3 gap-2">
            {[
              { label: 'Distância', value: popup.distanceKm.toFixed(1), unit: 'km', color: accent },
              { label: 'Vel. média', value: popup.avgSpeed.toFixed(1), unit: 'km/h', color: accent },
              { label: 'Cad. média', value: popup.avgCadence.toFixed(0), unit: 'rpm', color: accent2 }
            ].map((st) => (
              <div key={st.label} className="rounded-2xl py-2.5 bg-white/[0.04] ring-1 ring-white/[0.06]">
                <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-slate-500">{st.label}</span>
                <span className="mt-0.5 block text-lg font-bold tabular-nums text-white leading-tight">
                  {st.value} <span className="text-[10px] font-semibold" style={{ color: st.color }}>{st.unit}</span>
                </span>
              </div>
            ))}
          </div>

          {/* Auto-dismiss countdown */}
          <div className="relative mt-6 h-[3px] w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full origin-left rounded-full"
              style={{
                background: `linear-gradient(90deg, ${accent}, ${accent2})`,
                animation: `motivation-timer ${VISIBLE_MS}ms linear forwards`
              }}
            />
          </div>
          <span className="relative mt-2 block text-[10px] font-medium text-slate-500">Toca para fechar</span>
        </div>
      </div>
    </div>
  );
}
