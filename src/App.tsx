import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Starfield from "./components/Starfield";
import SolarSystem from "./components/SolarSystem";
import type { ScaleMode } from "./components/SolarSystem";
import PlanetRail from "./components/PlanetRail";
import InfoPanel from "./components/InfoPanel";
import ControlsDeck from "./components/ControlsDeck";
import { DEFAULT_SPEED_INDEX, PLANETS, SPEEDS } from "./data/planets";
import { centuriesSinceJ2000, clamp, heliocentricPosition, julianDay } from "./lib/astro";
import type { HeliocentricPosition } from "./lib/astro";

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
  const deckRef = useRef<HTMLDivElement>(null);

  /* misura l'altezza della barra di controllo per posizionare la scheda */
  useEffect(() => {
    const el = deckRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setDeckHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* loop di simulazione */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.25);
      last = now;
      setSimMs((m) => m + dt * SPEEDS[speedIndex].daysPerSecond * 86400000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speedIndex]);

  /* scorciatoie da tastiera */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      } else if (e.key === "Escape") {
        setSelectedId(null);
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => clamp(z * 1.15, 0.5, 2.4));
      } else if (e.key === "-") {
        setZoom((z) => clamp(z * 0.87, 0.5, 2.4));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* posizioni eliocentriche dei pianeti all'istante simulato */
  const T = centuriesSinceJ2000(simMs);
  const positions = useMemo(() => {
    const m = new Map<string, HeliocentricPosition>();
    for (const p of PLANETS) m.set(p.id, heliocentricPosition(p.elements, T));
    return m;
  }, [simMs, T]);

  const handleZoomDelta = useCallback((dir: 1 | -1) => {
    setZoom((z) => clamp(z * (dir > 0 ? 1.14 : 0.877), 0.5, 2.4));
  }, []);

  const selectedPosition =
    selectedId && selectedId !== "sole" ? positions.get(selectedId) ?? null : null;

  const now = new Date(simMs);
  const timeStr = now.toLocaleTimeString("it-IT", { hour12: false });
  const dateStr = now.toLocaleDateString("it-IT", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const jd = julianDay(simMs);

  return (
    <div className="scanlines relative h-full w-full overflow-hidden bg-void font-body text-slate-200">
      <Starfield />

      <SolarSystem
        simMs={simMs}
        positions={positions}
        scaleMode={scaleMode}
        zoom={zoom}
        selectedId={selectedId}
        showLabels={showLabels}
        showOrbits={showOrbits}
        onSelect={setSelectedId}
        onZoomDelta={handleZoomDelta}
      />

      <PlanetRail positions={positions} selectedId={selectedId} onSelect={setSelectedId} />

      {/* intestazione */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-4 px-4 pt-4 md:px-6 md:pt-5">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-holo" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
              <ellipse cx="12" cy="12" rx="10" ry="4.4" strokeWidth="1.2" transform="rotate(-18 12 12)" />
              <circle cx="20.2" cy="8.4" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            <span className="font-mono text-[10px] tracking-[0.34em] text-holo/80">
              PLANETARIO INTERATTIVO
            </span>
          </div>
          <h1 className="font-display text-[22px] font-extrabold leading-none tracking-[0.16em] text-slate-100 md:text-[28px]">
            SISTEMA <span className="text-holo">SOLARE</span>
          </h1>
          <p className="mt-1.5 hidden text-[11px] tracking-wide text-slate-400 sm:block">
            Il moto orbitale degli otto pianeti · vista dall’eclittica nord
          </p>
        </div>

        <div className="pointer-events-auto text-right">
          <span
            className={`inline-flex items-center gap-2 border px-2 py-[3px] font-mono text-[9.5px] tracking-[0.22em] ${
              playing
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                : "border-amber-400/40 bg-amber-400/10 text-amber-300"
            }`}
          >
            <span className="relative flex h-1.5 w-1.5">
              {playing && (
                <span className="anim-ping-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              )}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  playing ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
            </span>
            {playing ? "IN ESECUZIONE" : "IN PAUSA"}
          </span>
          <div className="tabular mt-1.5 font-display text-lg font-bold tracking-[0.14em] text-slate-100 md:text-[23px]">
            {timeStr}
          </div>
          <div className="text-[11px] text-slate-400">
            {dateStr}
            <span className="ml-1.5 font-mono text-[9.5px] text-slate-500">JD {jd.toFixed(1)}</span>
          </div>
        </div>
      </header>

      <InfoPanel
        selectedId={selectedId}
        position={selectedPosition}
        deckHeight={deckHeight}
        onClose={() => setSelectedId(null)}
      />

      <div ref={deckRef} className="absolute inset-x-0 bottom-0 z-40">
        <ControlsDeck
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        speedIndex={speedIndex}
        onSpeedChange={setSpeedIndex}
        simMs={simMs}
        onSetTime={setSimMs}
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
    </div>
  );
}
