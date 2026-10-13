import React, { useEffect, useId, useRef } from 'react';

// Road cyclist in an aero position (SVG units, viewBox 0 0 100 62, facing right).
// Crank, legs, wheels and a subtle shoulder bob are driven by the live cadence.

const REAR = { x: 20, y: 46 };
const FRONT = { x: 79, y: 46 };
const WHEEL_R = 14;
const BB = { x: 46, y: 47 };
const CRANK_R = 5.6;
const HIP = { x: 39.5, y: 21 };
const THIGH = 17.5;
const SHIN = 17;
const GEAR_RATIO = 2.8; // wheel turns per crank turn (big gear)

const f = (n) => n.toFixed(2);

function solveLeg(angle) {
  const pedal = { x: BB.x + CRANK_R * Math.cos(angle), y: BB.y + CRANK_R * Math.sin(angle) };
  // Ankle sits slightly above/behind the pedal spindle; a little ankling through the stroke
  const ankle = { x: pedal.x - 1.1, y: pedal.y - 2 - 0.4 * Math.sin(angle) };
  const dx = ankle.x - HIP.x;
  const dy = ankle.y - HIP.y;
  const d = Math.min(THIGH + SHIN - 0.01, Math.hypot(dx, dy));
  const a = Math.atan2(dy, dx);
  const bend = Math.acos((THIGH * THIGH + d * d - SHIN * SHIN) / (2 * THIGH * d));
  const knee = { x: HIP.x + THIGH * Math.cos(a - bend), y: HIP.y + THIGH * Math.sin(a - bend) };
  const shortsEnd = { x: HIP.x + (knee.x - HIP.x) * 0.58, y: HIP.y + (knee.y - HIP.y) * 0.58 };
  const toe = { x: pedal.x + 3.8, y: pedal.y + 0.3 };
  const heel = { x: ankle.x - 1.2, y: ankle.y + 0.6 };
  return {
    pedal,
    thigh: `M${f(HIP.x)} ${f(HIP.y)} L${f(knee.x)} ${f(knee.y)}`,
    shorts: `M${f(HIP.x)} ${f(HIP.y)} L${f(shortsEnd.x)} ${f(shortsEnd.y)}`,
    shin: `M${f(knee.x)} ${f(knee.y)} Q${f((knee.x + ankle.x) / 2 - 1.2)} ${f((knee.y + ankle.y) / 2)} ${f(ankle.x)} ${f(ankle.y)}`,
    shoe: `M${f(heel.x)} ${f(heel.y)} L${f(toe.x)} ${f(toe.y)}`
  };
}

function Wheel({ cx, cy, spokesRef }) {
  const spokes = [];
  for (let i = 0; i < 12; i++) {
    const r = (i * Math.PI) / 6;
    spokes.push(
      <line key={i} x1={cx} y1={cy} x2={cx + (WHEEL_R - 4.6) * Math.cos(r)} y2={cy + (WHEEL_R - 4.6) * Math.sin(r)} />
    );
  }
  return (
    <g>
      {/* Tyre */}
      <circle cx={cx} cy={cy} r={WHEEL_R} fill="none" stroke="#cbd5e1" strokeWidth="1.9" />
      {/* Deep-section carbon rim */}
      <circle cx={cx} cy={cy} r={WHEEL_R - 2.6} fill="none" stroke="rgba(15,23,42,0.95)" strokeWidth="3.4" />
      <circle cx={cx} cy={cy} r={WHEEL_R - 1.1} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.45" />
      <g ref={spokesRef} stroke="rgba(226,232,240,0.45)" strokeWidth="0.35">{spokes}</g>
      <circle cx={cx} cy={cy} r="1.5" fill="#e2e8f0" />
    </g>
  );
}

export default function RoadCyclist({ color, glow, cadence, isMoving, width = 88 }) {
  const uid = useId().replace(/:/g, '');
  const refs = {
    farThigh: useRef(null), farShorts: useRef(null), farShin: useRef(null), farShoe: useRef(null),
    nearThigh: useRef(null), nearShorts: useRef(null), nearShortsEdge: useRef(null), nearShin: useRef(null), nearShoe: useRef(null),
    crank: useRef(null), farCrank: useRef(null), rearSpokes: useRef(null), frontSpokes: useRef(null),
    upperBody: useRef(null)
  };
  const angleRef = useRef(Math.PI * 0.3);
  const rpmRef = useRef(0);

  useEffect(() => {
    rpmRef.current = isMoving ? Math.max(0, cadence) : 0;
  }, [cadence, isMoving]);

  useEffect(() => {
    let frame;
    let last = performance.now();

    const set = (ref, attr, val) => ref.current?.setAttribute(attr, val);

    const draw = () => {
      const angle = angleRef.current;
      const near = solveLeg(angle);
      const far = solveLeg(angle + Math.PI);
      set(refs.farThigh, 'd', far.thigh);
      set(refs.farShorts, 'd', far.shorts);
      set(refs.farShin, 'd', far.shin);
      set(refs.farShoe, 'd', far.shoe);
      set(refs.nearThigh, 'd', near.thigh);
      set(refs.nearShorts, 'd', near.shorts);
      set(refs.nearShortsEdge, 'd', near.shorts);
      set(refs.nearShin, 'd', near.shin);
      set(refs.nearShoe, 'd', near.shoe);
      set(refs.crank, 'd', `M${BB.x} ${BB.y} L${f(near.pedal.x)} ${f(near.pedal.y)}`);
      set(refs.farCrank, 'd', `M${BB.x} ${BB.y} L${f(far.pedal.x)} ${f(far.pedal.y)}`);
      const wheelDeg = ((angle * GEAR_RATIO * 180) / Math.PI) % 360;
      set(refs.rearSpokes, 'transform', `rotate(${f(wheelDeg)} ${REAR.x} ${REAR.y})`);
      set(refs.frontSpokes, 'transform', `rotate(${f(wheelDeg)} ${FRONT.x} ${FRONT.y})`);
      // Shoulders dip slightly twice per crank revolution
      set(refs.upperBody, 'transform', `translate(0 ${f(Math.sin(angle * 2) * 0.35)})`);
    };

    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (rpmRef.current > 0) {
        angleRef.current = (angleRef.current + (rpmRef.current / 60) * 2 * Math.PI * dt) % (2 * Math.PI);
        draw();
      }
      frame = requestAnimationFrame(tick);
    };

    draw();
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // refs are stable for the component's lifetime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const skin = '#d8a47a';
  const skinFar = '#9f7454';

  return (
    <svg
      viewBox="0 0 100 62"
      style={{ width, height: width * 0.62, filter: `drop-shadow(0 0 5px ${glow})` }}
      className="overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`jersey-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor={color} stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id={`frame-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Ground shadow */}
        <ellipse cx="49" cy="60.6" rx="36" ry="1.4" fill="rgba(0,0,0,0.55)" stroke="none" />

        {/* Far leg (behind the bike) */}
        <path ref={refs.farThigh} stroke={skinFar} strokeWidth="5.2" />
        <path ref={refs.farShorts} stroke="#05070c" strokeWidth="5.5" />
        <path ref={refs.farShin} stroke={skinFar} strokeWidth="3.8" />
        <path ref={refs.farShoe} stroke="#94a3b8" strokeWidth="2.3" />
        <path ref={refs.farCrank} stroke="#475569" strokeWidth="1.3" />

        {/* Wheels */}
        <Wheel cx={REAR.x} cy={REAR.y} spokesRef={refs.rearSpokes} />
        <Wheel cx={FRONT.x} cy={FRONT.y} spokesRef={refs.frontSpokes} />

        {/* Drivetrain */}
        <path d={`M${BB.x} ${BB.y - 4.6} L${REAR.x} ${REAR.y - 2.2} M${BB.x} ${BB.y + 4.6} L${REAR.x} ${REAR.y + 2.2}`} stroke="#64748b" strokeWidth="0.6" />
        <circle cx={REAR.x} cy={REAR.y} r="2.3" stroke="#94a3b8" strokeWidth="0.9" />
        <circle cx={BB.x} cy={BB.y} r="4.6" stroke="#cbd5e1" strokeWidth="1.1" />

        {/* Frame */}
        <g stroke={`url(#frame-${uid})`} strokeWidth="2.2">
          <path d={`M${BB.x} ${BB.y} L41.4 23.6`} />{/* seat tube */}
          <path d="M41 26 L70.6 26.2" />{/* top tube */}
          <path d={`M71.6 30 L${BB.x} ${BB.y}`} strokeWidth="2.8" />{/* down tube */}
          <path d="M70.4 24.6 L72.2 31.2" strokeWidth="3" />{/* head tube */}
        </g>
        <g stroke="#cbd5e1" strokeWidth="1.4">
          <path d={`M${BB.x} ${BB.y} L${REAR.x} ${REAR.y}`} />{/* chainstay */}
          <path d={`M41.3 27 L${REAR.x} ${REAR.y}`} />{/* seatstay */}
          <path d={`M72 31 Q75.6 39 ${FRONT.x} ${FRONT.y}`} strokeWidth="1.7" />{/* fork */}
        </g>
        {/* Saddle */}
        <path d="M34.4 22.7 Q38.5 21.2 43.8 22.3 L43.3 23.4 Q38.6 23 35 23.7 Z" fill="#0f172a" stroke="#475569" strokeWidth="0.5" />
        {/* Stem + drop handlebar + hood */}
        <path d="M70.6 25 L75.2 23.5" stroke="#cbd5e1" strokeWidth="1.8" />
        <path d="M75.2 23.5 Q79.6 23.3 79.4 26.8 Q79.1 30 76.1 30.2" stroke="#e2e8f0" strokeWidth="1.5" />
        <path d="M77.6 23.6 L78.7 26.6" stroke="#0f172a" strokeWidth="1.4" />

        {/* Near crank arm + pedal */}
        <path ref={refs.crank} stroke="#e2e8f0" strokeWidth="1.6" />
        <circle cx={BB.x} cy={BB.y} r="1.2" fill="#e2e8f0" stroke="none" />

        {/* Upper body (bobs with the pedal stroke) */}
        <g ref={refs.upperBody}>
          {/* Torso: flat aero back */}
          <path
            d="M36.2 18.6 Q47.6 8.6 62.6 10.4 Q66.4 11.2 66 14.2 Q52.6 17.8 42.2 23.4 Q37.4 23.8 36.2 18.6 Z"
            fill={`url(#jersey-${uid})`}
            stroke="none"
          />
          {/* Jersey side stripe */}
          <path d="M39.5 18.8 Q50 12.6 63.4 12.4" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
          {/* Neck + head */}
          <path d="M63.4 11.6 L66.8 9.8" stroke={skin} strokeWidth="2.6" />
          <circle cx="68.8" cy="9.2" r="3.2" fill={skin} stroke="none" />
          {/* Aero helmet with tail */}
          <path d="M64.4 8.8 Q66 4.5 70.6 5 Q73.8 5.6 73.1 8.3 L66.4 9.3 Q61.6 9.7 58.6 9 Q61 8.2 64.4 8.8 Z" fill="#f8fafc" stroke="none" />
          <path d="M60.6 8.7 Q66 6.6 72.4 6.9" stroke={color} strokeWidth="0.9" />
          {/* Sunglasses */}
          <path d="M70 9.3 L72.8 9.4" stroke="#0f172a" strokeWidth="1.3" />
          {/* Arm: jersey sleeve, bent elbow, gloved hand on the hoods */}
          <path d="M64 13.4 L66.3 16.6" stroke={color} strokeWidth="3.6" />
          <path d="M66.3 16.6 L68.6 19.6 L77.4 23.8" stroke={skin} strokeWidth="2.5" />
          <circle cx="77.8" cy="23.9" r="1.35" fill="#1e293b" stroke="none" />
        </g>

        {/* Near leg (in front of the bike) */}
        <path ref={refs.nearThigh} stroke={skin} strokeWidth="5.6" />
        <path ref={refs.nearShortsEdge} stroke="rgba(255,255,255,0.2)" strokeWidth="6.4" />
        <path ref={refs.nearShorts} stroke="#0b0f17" strokeWidth="5.7" />
        <path ref={refs.nearShin} stroke={skin} strokeWidth="4" />
        <path ref={refs.nearShoe} stroke="#f8fafc" strokeWidth="2.5" />
      </g>
    </svg>
  );
}
