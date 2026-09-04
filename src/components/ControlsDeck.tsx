import { useEffect, useMemo, useRef, useState } from "react";
import { SPEEDS } from "../data/planets";
import type { ScaleMode } from "./SolarSystem";
import { toLocalInputValue } from "../lib/astro";

interface Props {
  playing: boolean;
  onTogglePlay: () => void;
  speedIndex: number;
  onSpeedChange: (i: number) => void;
  simMs: number;
  onSetTime: (ms: number) => void;
  onResetNow: () => void;
  scaleMode: ScaleMode;
  onScaleMode: (m: ScaleMode) => void;
  showOrbits: boolean;
  onToggleOrbits: () => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  zoom: number;
  onZoomDelta: (dir: 1 | -1) => void;
}

function GroupLabel({ children }: { children: string }) {
  return <p className="mb-1 font-mono text-[9px] tracking-[0.28em] text-slate-500">{children}</p>;
}

export default function ControlsDeck({
  playing,
  onTogglePlay,
  speedIndex,
  onSpeedChange,
  simMs,
  onSetTime,
  onResetNow,
  scaleMode,
  onScaleMode,
  showOrbits,
  onToggleOrbits,
  showLabels,
  onToggleLabels,
  zoom,
  onZoomDelta,
}: Props) {
  const [draft, setDraft] = useState(() => toLocalInputValue(simMs));
  const focused = useRef(false);

  const dateOnly = useMemo(
    () =>
      new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "short", year: "numeric" }).format(simMs),
    [simMs],
  );

  // sincronizza il campo con l'orologio di simulazione (tranne durante la modifica)
  useEffect(() => {
    if (!focused.current) setDraft(toLocalInputValue(simMs));
  }, [simMs]);

  const commit = (v: string) => {
    const t = new Date(v).getTime();
    if (Number.isFinite(t)) onSetTime(t);
  };

  return (
    <div className="border-t border-holo/15 bg-[#050d1a]/92 backdrop-blur-md">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-3 px-3 py-2.5 md:px-5 md:py-3">
        {/* riproduzione */}
        <div className="flex items-end gap-3">
          <div>
            <GroupLabel>{playing ? "RIPRODUZIONE" : "IN PAUSA"}</GroupLabel>
            <button
              onClick={onTogglePlay}
              aria-label={playing ? "Pausa" : "Riproduci"}
              className={`flex h-11 w-11 items-center justify-center border transition-all duration-200 active:scale-90 ${
                playing
                  ? "border-holo/60 bg-holo/15 text-holo-strong shadow-[0_0_16px_rgba(110,231,242,0.28)]"
                  : "border-holo/30 bg-holo/5 text-holo hover:bg-holo/15"
              }`}
            >
              {playing ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          <div>
            <GroupLabel>VELOCITÀ</GroupLabel>
            <div className="flex">
              {SPEEDS.map((s, i) => (
                <button
                  key={s.label}
                  onClick={() => onSpeedChange(i)}
                  className={`border px-2 py-[7px] font-mono text-[10.5px] tabular transition-all duration-150 first:border-r-0 [&:not(:first-child)]:border-l-0 ${
                    i === speedIndex
                      ? "border-holo/70 bg-holo/15 text-holo-strong shadow-[0_0_14px_rgba(110,231,242,0.2)]"
                      : "border-white/12 text-slate-400 hover:border-holo/40 hover:text-slate-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <span className="hidden h-11 w-px bg-white/10 md:block" />

        {/* data e ora */}
        <div>
          <GroupLabel>DATA E ORA · SIMULAZIONE</GroupLabel>
          <div className="flex items-stretch gap-1.5">
            {playing ? (
              <div
                className="flex items-center gap-2.5 border border-white/12 bg-white/[0.03] px-3"
                title="Metti in pausa per modificare data e ora"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="anim-ping-dot absolute inline-flex h-full w-full rounded-full bg-holo" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-holo" />
                </span>
                <span className="font-mono text-[12px] tabular text-slate-300">{dateOnly}</span>
                <span className="hidden font-mono text-[9.5px] text-slate-600 sm:inline">
                  ora nascosta durante il moto
                </span>
              </div>
            ) : (
              <input
                type="datetime-local"
                value={draft}
                onFocus={() => (focused.current = true)}
                onBlur={() => {
                  focused.current = false;
                  commit(draft);
                }}
                onChange={(e) => {
                  setDraft(e.target.value);
                  commit(e.target.value);
                }}
                aria-label="Data e ora della simulazione"
                className="rounded-[3px] border border-white/15 bg-white/[0.04] px-2 py-[7px] font-mono text-[12px] text-slate-100 outline-none transition-colors focus:border-holo/70"
              />
            )}
            <button
              onClick={onResetNow}
              className="flex items-center gap-1.5 border border-solar/50 px-2.5 font-display text-[10px] tracking-[0.18em] text-solar transition-all duration-150 hover:bg-solar/10 active:scale-95"
              title="Torna alla data e ora attuali"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="7" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
              </svg>
              ADESSO
            </button>
          </div>
        </div>

        <span className="hidden h-11 w-px bg-white/10 md:block" />

        {/* scala + visibilità */}
        <div>
          <GroupLabel>SCALA DISTANZE</GroupLabel>
          <div className="flex overflow-hidden rounded-[3px] border border-white/12">
            {(["compressa", "reale"] as ScaleMode[]).map((m) => (
              <button
                key={m}
                onClick={() => onScaleMode(m)}
                className={`px-2.5 py-[7px] font-display text-[10px] tracking-[0.14em] transition-all duration-150 ${
                  scaleMode === m ? "bg-holo/15 text-holo-strong" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {m === "compressa" ? "COMPRESSA" : "REALE"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <GroupLabel>VISUALIZZA</GroupLabel>
          <div className="flex gap-1.5">
            {[
              { label: "Orbite", active: showOrbits, toggle: onToggleOrbits },
              { label: "Etichette", active: showLabels, toggle: onToggleLabels },
            ].map((t) => (
              <button
                key={t.label}
                onClick={t.toggle}
                className={`flex items-center gap-1.5 border px-2 py-[7px] text-[11px] transition-all duration-150 ${
                  t.active
                    ? "border-holo/45 text-slate-100"
                    : "border-white/12 text-slate-500 hover:border-white/25 hover:text-slate-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full transition-all ${
                    t.active ? "bg-holo shadow-[0_0_6px_rgba(110,231,242,0.9)]" : "bg-slate-600"
                  }`}
                />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <span className="hidden h-11 w-px bg-white/10 md:block" />

        {/* zoom */}
        <div>
          <GroupLabel>ZOOM</GroupLabel>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onZoomDelta(-1)}
              aria-label="Riduci zoom"
              className="flex h-[30px] w-8 items-center justify-center border border-white/12 text-slate-300 transition-all hover:border-holo/45 hover:text-holo active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M5 12h14" />
              </svg>
            </button>
            <span className="w-12 text-center font-mono text-[11px] tabular text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => onZoomDelta(1)}
              aria-label="Aumenta zoom"
              className="flex h-[30px] w-8 items-center justify-center border border-white/12 text-slate-300 transition-all hover:border-holo/45 hover:text-holo active:scale-90"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
        </div>

        {/* scorciatoie */}
        <div className="ml-auto hidden flex-col items-end gap-0.5 self-center font-mono text-[9.5px] leading-relaxed text-slate-600 xl:flex">
          <span>SPAZIO riproduci/pausa · ROTELLA zoom</span>
          <span>ESC chiudi scheda · + / − zoom</span>
        </div>
      </div>
    </div>
  );
}
