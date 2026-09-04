import { useEffect, useMemo, useState } from "react";
import { buildStarMapSvg, buildStarMapSvg3D, starMapFilename } from "../lib/starmap";
import type { StarMapScaleMode } from "../lib/starmap";
import { toLocalInputValue } from "../lib/astro";

interface Props {
  initialMs: number;
  camAz: number;
  camEl: number;
  scaleMode: StarMapScaleMode;
  onClose: () => void;
}

export default function SnapshotModal({ initialMs, camAz, camEl, scaleMode, onClose }: Props) {
  const [ms, setMs] = useState(initialMs);
  const [draft, setDraft] = useState(() => toLocalInputValue(initialMs));
  const [title, setTitle] = useState("");
  const [invert, setInvert] = useState(false);
  const [view, setView] = useState<"alto" | "3d">("alto");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const svg = useMemo(
    () =>
      view === "3d"
        ? buildStarMapSvg3D({
            dateMs: ms,
            title: title.trim() || "Allineamento planetario",
            invert,
            azDeg: camAz,
            elDeg: camEl,
            scaleMode,
          })
        : buildStarMapSvg({
            dateMs: ms,
            title: title.trim() || "Allineamento planetario",
            invert,
          }),
    [ms, title, invert, view, camAz, camEl, scaleMode],
  );

  const download = () => {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = starMapFilename(ms);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const commit = (v: string) => {
    const t = new Date(v).getTime();
    if (Number.isFinite(t)) setMs(t);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="bracket anim-fade-up relative flex max-h-[94vh] w-[min(1020px,96vw)] flex-col overflow-hidden border border-holo/25 bg-[#081120] shadow-[0_0_60px_rgba(110,231,242,0.12)] md:flex-row">
        {/* anteprima */}
        <div className="panel-scroll min-h-0 flex-1 overflow-auto bg-black/50 p-3 md:p-5">
          <div
            className="mx-auto w-full max-w-[560px] [&>svg]:h-auto [&>svg]:w-full [&>svg]:shadow-[0_0_40px_rgba(0,0,0,0.6)]"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>

        {/* pannello comandi */}
        <div className="panel-scroll flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-t border-white/10 p-5 md:w-[320px] md:border-l md:border-t-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[16px] font-extrabold tracking-[0.14em] text-slate-50">
                ISTANTANEA CELESTE
              </h2>
              <p className="mt-0.5 font-mono text-[9.5px] tracking-[0.22em] text-holo/70">
                MAPPA VETTORIALE B/N
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Chiudi"
              className="flex h-7 w-7 items-center justify-center text-slate-400 transition-colors hover:text-holo"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <p className="text-[12px] leading-relaxed text-slate-400">
            La disposizione dei pianeti in un giorno che conta: una nascita, un anniversario, un inizio.
            Scaricala come file vettoriale e stampala quanto vuoi, senza perdere definizione.
          </p>

          <label className="block">
            <span className="mb-1 block font-mono text-[9.5px] tracking-[0.25em] text-slate-500">
              TITOLO (OPZIONALE)
            </span>
            <input
              type="text"
              value={title}
              maxLength={42}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Il nostro giorno"
              className="w-full border border-white/15 bg-white/[0.04] px-2.5 py-2 text-[13px] text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-holo/70"
            />
          </label>

          <div>
            <span className="mb-1 block font-mono text-[9.5px] tracking-[0.25em] text-slate-500">VISTA</span>
            <div className="flex">
              {(
                [
                  { id: "alto", label: "DALL'ALTO · CARTA" },
                  { id: "3d", label: "TRIDIMENSIONALE" },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`flex-1 border px-2 py-2 font-display text-[9px] tracking-[0.12em] transition-all duration-150 ${
                    view === v.id
                      ? "border-holo/60 bg-holo/12 text-holo-strong"
                      : "border-white/12 text-slate-500 hover:text-slate-300"
                  } ${v.id === "alto" ? "border-r-0" : ""}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
            {view === "3d" && (
              <p className="mt-1 font-mono text-[9px] text-slate-600">
                usa l'inquadratura orbitale al momento dell'apertura (AZ {Math.round(camAz)}° · EL{" "}
                {Math.round(camEl)}°)
              </p>
            )}
          </div>

          <label className="block">
            <span className="mb-1 block font-mono text-[9.5px] tracking-[0.25em] text-slate-500">
              DATA E ORA DELL'EVENTO
            </span>
            <input
              type="datetime-local"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                commit(e.target.value);
              }}
              className="w-full border border-white/15 bg-white/[0.04] px-2.5 py-2 font-mono text-[12.5px] text-slate-100 outline-none transition-colors focus:border-holo/70"
            />
          </label>

          <button
            onClick={() => setInvert((v) => !v)}
            className="flex items-center justify-between border border-white/12 px-3 py-2.5 text-left transition-colors hover:border-holo/40"
          >
            <span className="text-[11.5px] text-slate-300">
              Negativo <span className="text-slate-500">(sfondo chiaro, ideale per la stampa)</span>
            </span>
            <span
              className={`relative h-[18px] w-9 shrink-0 rounded-full border transition-colors ${
                invert ? "border-holo/70 bg-holo/25" : "border-white/20 bg-white/5"
              }`}
            >
              <span
                className={`absolute top-[2px] h-[12px] w-[12px] rounded-full transition-all ${
                  invert ? "left-[20px] bg-holo" : "left-[3px] bg-slate-500"
                }`}
              />
            </span>
          </button>

          <button
            onClick={download}
            className="flex items-center justify-center gap-2 bg-holo px-4 py-3 font-display text-[12px] font-bold tracking-[0.2em] text-[#04121c] transition-all hover:bg-holo-strong hover:shadow-[0_0_24px_rgba(110,231,242,0.45)] active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
            </svg>
            SCARICA SVG
          </button>
          <p className="-mt-2 text-center font-mono text-[10px] text-slate-600">{starMapFilename(ms)}</p>

          <p className="mt-auto border-t border-white/[0.06] pt-3 font-mono text-[9px] leading-relaxed text-slate-600">
            Formati consigliati: stampa, incisione, tatuaggio, web. Essendo vettoriale, scala a qualsiasi
            dimensione.
          </p>
        </div>
      </div>
    </div>
  );
}
