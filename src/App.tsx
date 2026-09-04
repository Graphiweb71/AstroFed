import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Starfield from "./components/Starfield";
import SolarSystem from "./components/SolarSystem";
import type { ScaleMode } from "./components/SolarSystem";
import PlanetRail from "./components/PlanetRail";
import InfoPanel from "./components/InfoPanel";
import ControlsDeck from "./components/ControlsDeck";
import OrbitJoystick from "./components/OrbitJoystick";
import SnapshotModal from "./components/SnapshotModal";
import { DEFAULT_SPEED_INDEX, PLANETS, SPEEDS } from "./data/planets";
import { centuriesSinceJ2000, clamp, heliocentricPosition } from "./lib/astro";
import type { HeliocentricPosition } from "./lib/astro";

const DEFAULT_CAM = { az: -38, el: 56 };
const EL_LIMIT = 89;

const ZoomButton = memo(function ZoomButton({
  label,
  title,
  onClick,
}: {
  label: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-[26px] w-[26px] items-center justify-center border border-white/10 bg-white/[0.04] font-display text-[13px] leading-none text-slate-300 transition-all duration-150 hover:border-holo/60 hover:text-holo active:scale-90"
    >
      {label}
    </button>
  );
});

const Toggle = memo(function Toggle({
  label,
  active,
  onClick,
  title,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`border px-2 py-[5px] font-display text-[9px] tracking-[0.14em] transition-all duration-150 ${
        active
          ? "border-holo/50 bg-holo/10 text-holo"
          : "border-white/10 text-slate-500 hover:border-white/25 hover:text-slate-300"
      }`}
    >
      {label}
    </button>
  );
});

const Chip = memo(function Chip({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div title={title} className="border border-white/10 bg-white/[0.04] px-2 py-[5px]">
      <span className="font-mono text-[8.5px] tracking-[0.18em] text-slate-500">{label} </span>
      <span className="font-mono text-[10.5px] tabular text-slate-200">{value}</span>
    </div>
  );
});

export default function App() {
  const [simMs, setSimMs] = useState(() => Date.now());
  const [playing, setPlaying] = useState(true);
  const [speedIndex, setSpeedIndex] = useState(DEFAULT_SPEED_INDEX);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scaleMode, setScaleMode] = useState<ScaleMode>("compressa");
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [deckHeight, setDeckHeight] = useState(96);
  const [snapOpen, setSnapOpen] = useState(false);
  const [snapCam, setSnapCam] = useState({ az: DEFAULT_CAM.az, el: DEFAULT_CAM.el });
  const [dragging, setDragging] = useState(false);
  const [, setTick] = useState(0);

  const deckRef = useRef<HTMLDivElement>(null);
  const camRef = useRef({ ...DEFAULT_CAM });
  const camTargetRef = useRef({ ...DEFAULT_CAM });
  const dragRef = useRef<{ x: number; y: number; az: number; el: number } | null>(null);
  const suppressClickRef = useRef(false);
  const playingRef = useRef(playing);
  const speedRef = useRef(speedIndex);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    speedRef.current = speedIndex;
  }, [speedIndex]);

  /* misura l'altezza della barra di controllo per posizionare i pannelli */
  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setDeckHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* loop unico: avanza la simulazione e smorza la camera orbitale */
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(5, (now - last) / 1000);
      last = now;
      if (playingRef.current) {
        setSimMs((m) => m + SPEEDS[speedRef.current].daysPerSecond * 86400000 * dt);
      }
      const cam = camRef.current;
      const tgt = camTargetRef.current;
      const daz = tgt.az - cam.az;
      const del = tgt.el - cam.el;
      if (Math.abs(daz) > 0.01 || Math.abs(del) > 0.01) {
        cam.az += daz * 0.16;
        cam.el += del * 0.16;
        setTick((t) => t + 1);
      } else if (cam.az !== tgt.az || cam.el !== tgt.el) {
        cam.az = tgt.az;
        cam.el = tgt.el;
        setTick((t) => t + 1);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []);

  const positions = useMemo(() => {
    const T = centuriesSinceJ2000(simMs);
    const map = new Map<string, HeliocentricPosition>();
    for (const p of PLANETS) map.set(p.id, heliocentricPosition(p.elements, T));
    return map;
  }, [simMs]);

  const selectedPosition = selectedId && selectedId !== "sole" ? positions.get(selectedId) ?? null : null;

  const handleSelect = useCallback((id: string | null) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setSelectedId(id);
  }, []);

  const handleZoomDelta = useCallback((dir: 1 | -1) => {
    setZoom((z) => clamp(Math.round(z * Math.pow(1.3, dir) * 100) / 100, 0.45, 7));
  }, []);

  /* trascinamento sullo sfondo = comando ORBIT (Sole fisso al centro) */
  const onStagePointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      az: camTargetRef.current.az,
      el: camTargetRef.current.el,
    };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onStagePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) suppressClickRef.current = true;
    camTargetRef.current.az = d.az + dx * 0.35;
    camTargetRef.current.el = clamp(d.el - dy * 0.35, -EL_LIMIT, EL_LIMIT);
  };
  const endDrag = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const onJoystickDelta = useCallback((dAz: number, dEl: number) => {
    const t = camTargetRef.current;
    t.az += dAz;
    t.el = clamp(t.el + dEl, -EL_LIMIT, EL_LIMIT);
  }, []);
  const onCamReset = useCallback(() => {
    camTargetRef.current = { ...DEFAULT_CAM };
  }, []);
  const onCamTop = useCallback(() => {
    camTargetRef.current = { az: 0, el: EL_LIMIT };
  }, []);

  /* scorciatoie da tastiera */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (inField) return;
      if (e.key === " ") {
        if (tag === "BUTTON") return;
        e.preventDefault();
        setPlaying((p) => !p);
        return;
      }
      if (e.key === "+" || e.key === "=") handleZoomDelta(1);
      else if (e.key === "-") handleZoomDelta(-1);
      else if (e.key === "Escape") {
        if (snapOpen) return; // la modale gestisce il proprio Esc
        setSelectedId(null);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const t = camTargetRef.current;
        if (e.key === "ArrowLeft") t.az -= 5;
        if (e.key === "ArrowRight") t.az += 5;
        if (e.key === "ArrowUp") t.el = clamp(t.el + 5, -EL_LIMIT, EL_LIMIT);
        if (e.key === "ArrowDown") t.el = clamp(t.el - 5, -EL_LIMIT, EL_LIMIT);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleZoomDelta, snapOpen]);

  const d = new Date(simMs);
  const dateIt = d.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
  const timeIt = d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  const jd = (simMs / 86400000 + 2440587.5).toFixed(2);
  const cam = camRef.current;

  return (
    <div className="scanlines relative h-full w-full overflow-hidden bg-void font-body">
      <Starfield />

      {/* scena 3D (trascinabile) */}
      <div
        className={`absolute inset-0 touch-none select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        onPointerDown={onStagePointerDown}
        onPointerMove={onStagePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <SolarSystem
          simMs={simMs}
          positions={positions}
          scaleMode={scaleMode}
          zoom={zoom}
          camAz={cam.az}
          camEl={cam.el}
          selectedId={selectedId}
          showLabels={showLabels}
          showOrbits={showOrbits}
          onSelect={handleSelect}
          onZoomDelta={handleZoomDelta}
        />
      </div>

      {/* intestazione */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 md:px-6">
          <div>
            <h1 className="font-display text-lg font-extrabold tracking-[0.3em] text-slate-100 md:text-xl">
              PLANETARIO <span className="text-holo">ORBITALE</span>
            </h1>
            <p className="mt-1 flex items-center gap-2 font-mono text-[10px] tracking-[0.25em] text-holo/70">
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${playing ? "bg-holo" : "bg-slate-600"}`} />
              SIMULATORE DEL SISTEMA SOLARE · 8 PIANETI · TEMPO REALE O ACCELERATO
            </p>
          </div>
          <div className="pointer-events-auto flex flex-wrap items-center gap-2">
            {playing ? (
              <Chip
                label="SIMULAZIONE"
                value="IN MOTO"
                title="L'orologio è sospeso durante il moto: metti in pausa per leggere data e ora"
              />
            ) : (
              <>
                <Chip label="DATA" value={dateIt} title="Data simulata" />
                <Chip label="ORA" value={timeIt} title="Ora simulata" />
                <Chip label="G. GIULIANO" value={jd} title="Giorno giuliano" />
              </>
            )}
            <button
              onClick={() => {
                setSnapCam({ az: camRef.current.az, el: camRef.current.el });
                setSnapOpen(true);
              }}
              title="Genera la mappa celeste vettoriale in bianco e nero per una data"
              className="flex items-center gap-2 border border-solar/50 bg-solar/5 px-3 py-[6px] font-display text-[9.5px] tracking-[0.18em] text-solar transition-all duration-150 hover:bg-solar/15 hover:shadow-[0_0_16px_rgba(255,198,92,0.25)] active:scale-95"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" />
                <path d="M12 7.5l1.1 3.4L16.5 12l-3.4 1.1L12 16.5l-1.1-3.4L7.5 12l3.4-1.1z" />
              </svg>
              <span className="hidden sm:inline">ISTANTANEA</span>
            </button>
            <div className="flex gap-[3px]">
              <ZoomButton label="−" title="Riduci zoom (rotellina o −)" onClick={() => handleZoomDelta(-1)} />
              <ZoomButton label="+" title="Aumenta zoom (rotellina o +)" onClick={() => handleZoomDelta(1)} />
            </div>
            <Toggle
              label="ETICHETTE"
              active={showLabels}
              onClick={() => setShowLabels((v) => !v)}
              title="Mostra o nascondi i nomi dei pianeti"
            />
            <Toggle
              label="ORBITE"
              active={showOrbits}
              onClick={() => setShowOrbits((v) => !v)}
              title="Mostra o nascondi le traiettorie orbitali"
            />
          </div>
        </div>
      </header>

      {/* elenco corpi celesti */}
      <PlanetRail positions={positions} selectedId={selectedId} onSelect={handleSelect} />

      {/* joystick comando orbita */}
      <div className="absolute left-3 z-20 md:left-5" style={{ bottom: deckHeight + 16 }}>
        <OrbitJoystick az={cam.az} el={cam.el} onDelta={onJoystickDelta} onReset={onCamReset} onTopView={onCamTop} />
      </div>

      {/* scheda del corpo selezionato */}
      <InfoPanel
        selectedId={selectedId}
        position={selectedPosition}
        deckHeight={deckHeight}
        onClose={() => setSelectedId(null)}
      />

      {/* barra di controllo */}
      <div ref={deckRef} className="absolute inset-x-0 bottom-0 z-40">
        <ControlsDeck
          playing={playing}
          onTogglePlay={() => setPlaying((p) => !p)}
          speedIndex={speedIndex}
          onSpeedChange={setSpeedIndex}
          simMs={simMs}
          onSetTime={(ms) => setSimMs(ms)}
          onResetNow={() => setSimMs(Date.now())}
          scaleMode={scaleMode}
          onScaleMode={setScaleMode}
          showOrbits={showOrbits}
          onToggleOrbits={() => setShowOrbits((v) => !v)}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels((v) => !v)}
          zoom={zoom}
          onZoomDelta={handleZoomDelta}
        />
      </div>

      {snapOpen && (
        <SnapshotModal
          initialMs={simMs}
          camAz={snapCam.az}
          camEl={snapCam.el}
          scaleMode={scaleMode}
          onClose={() => setSnapOpen(false)}
        />
      )}
    </div>
  );
}
