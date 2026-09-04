import { useEffect, useRef, useState } from "react";

interface Props {
  az: number;
  el: number;
  onDelta: (dAz: number, dEl: number) => void;
  onReset: () => void;
  onTopView: () => void;
}

const PAD = 124;
const MAX = 42;

export default function OrbitJoystick({ az, el, onDelta, onReset, onTopView }: Props) {
  const padRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const moveKnob = (clientX: number, clientY: number) => {
    const el2 = padRef.current;
    if (!el2) return;
    const r = el2.getBoundingClientRect();
    let dx = clientX - (r.left + r.width / 2);
    let dy = clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > MAX) {
      dx = (dx / len) * MAX;
      dy = (dy / len) * MAX;
    }
    knobRef.current = { x: dx, y: dy };
    setKnob(knobRef.current);
  };

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const step = () => {
      const k = knobRef.current;
      if (k.x !== 0 || k.y !== 0) onDelta((k.x / MAX) * 1.25, (-k.y / MAX) * 0.95);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, onDelta]);

  const release = () => {
    activeRef.current = null;
    knobRef.current = { x: 0, y: 0 };
    setKnob({ x: 0, y: 0 });
    setActive(false);
  };

  const fmt = (v: number) => `${v < 0 ? "−" : "+"}${String(Math.abs(Math.round(v))).padStart(3, "0")}°`;

  return (
    <div className="flex select-none flex-col items-center gap-1.5">
      <p className="font-mono text-[9px] tracking-[0.3em] text-slate-500">VISTA · ORBITA 3D</p>
      <div
        ref={padRef}
        role="slider"
        aria-label="Joystick orbita: trascina per ruotare il punto di vista"
        className={`relative touch-none rounded-full border bg-[#0a1526]/85 shadow-[inset_0_0_24px_rgba(4,10,20,0.8)] backdrop-blur transition-colors ${
          active ? "cursor-grabbing border-holo/70" : "cursor-grab border-holo/30 hover:border-holo/55"
        }`}
        style={{ width: PAD, height: PAD }}
        onPointerDown={(e) => {
          activeRef.current = e.pointerId;
          setActive(true);
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          moveKnob(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (activeRef.current === e.pointerId) moveKnob(e.clientX, e.clientY);
        }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        <svg viewBox="0 0 124 124" className="pointer-events-none absolute inset-0">
          <circle cx="62" cy="62" r="58" fill="none" stroke="#6ee7f2" strokeOpacity="0.16" />
          {Array.from({ length: 24 }, (_, k) => {
            const a = (k * 15 * Math.PI) / 180;
            const r1 = k % 6 === 0 ? 48 : 53;
            return (
              <line
                key={k}
                x1={62 + Math.cos(a) * r1}
                y1={62 - Math.sin(a) * r1}
                x2={62 + Math.cos(a) * 58}
                y2={62 - Math.sin(a) * 58}
                stroke="#6ee7f2"
                strokeOpacity={k % 6 === 0 ? 0.45 : 0.2}
              />
            );
          })}
          <line x1="62" y1="10" x2="62" y2="114" stroke="#6ee7f2" strokeOpacity="0.1" />
          <line x1="10" y1="62" x2="114" y2="62" stroke="#6ee7f2" strokeOpacity="0.1" />
        </svg>
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 rounded-full border border-holo/80 bg-holo/20 shadow-[0_0_16px_rgba(110,231,242,0.4)]"
          style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
        >
          <div className="absolute inset-[7px] rounded-full border border-holo/50" />
        </div>
      </div>
      <p className="font-mono text-[9.5px] tabular tracking-wider text-holo/75">
        AZ {fmt(az)} · EL {fmt(el)}
      </p>
      <div className="flex gap-1.5">
        <button
          onClick={onTopView}
          className="border border-white/12 px-2 py-[5px] font-display text-[8.5px] tracking-[0.16em] text-slate-400 transition-all hover:border-holo/50 hover:text-holo active:scale-95"
          title="Vista dall'alto (nord eclittico)"
        >
          DALL'ALTO
        </button>
        <button
          onClick={onReset}
          className="border border-white/12 px-2 py-[5px] font-display text-[8.5px] tracking-[0.16em] text-slate-400 transition-all hover:border-holo/50 hover:text-holo active:scale-95"
          title="Ripristina vista assonometrica"
        >
          RESET VISTA
        </button>
      </div>
    </div>
  );
}
