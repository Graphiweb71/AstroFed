import { PLANETS, SUN } from "../data/planets";
import type { HeliocentricPosition } from "../lib/astro";

interface Props {
  positions: Map<string, HeliocentricPosition>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function PlanetRail({ positions, selectedId, onSelect }: Props) {
  return (
    <nav className="absolute left-4 top-1/2 z-20 hidden w-[178px] -translate-y-1/2 lg:block xl:left-6">
      <p className="mb-2 font-mono text-[10px] tracking-[0.32em] text-holo/70">CORPI CELESTI</p>
      <ul className="space-y-[3px]">
        <li>
          <button
            onClick={() => onSelect(SUN.id)}
            className={`flex w-full items-center gap-2.5 border-l-2 px-3 py-[7px] text-left transition-all duration-200 ${
              selectedId === SUN.id
                ? "border-solar bg-solar/10"
                : "border-transparent hover:translate-x-0.5 hover:bg-white/[0.05]"
            }`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: "#ffc65c", boxShadow: "0 0 9px rgba(255,198,92,0.9)" }}
            />
            <span
              className={`flex-1 font-display text-[11px] tracking-[0.18em] ${
                selectedId === SUN.id ? "text-solar" : "text-slate-300"
              }`}
            >
              SOLE
            </span>
            <span className="font-mono text-[9.5px] text-slate-500">stella</span>
          </button>
        </li>
        {PLANETS.map((p) => {
          const pos = positions.get(p.id);
          const sel = selectedId === p.id;
          return (
            <li key={p.id}>
              <button
                onClick={() => onSelect(p.id)}
                className={`flex w-full items-center gap-2.5 border-l-2 px-3 py-[7px] text-left transition-all duration-200 ${
                  sel ? "border-holo bg-holo/10" : "border-transparent hover:translate-x-0.5 hover:bg-white/[0.05]"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: p.colors.base, boxShadow: `0 0 8px ${p.colors.base}` }}
                />
                <span
                  className={`flex-1 font-display text-[11px] tracking-[0.18em] ${
                    sel ? "text-holo-strong" : "text-slate-300"
                  }`}
                >
                  {p.nome.toUpperCase()}
                </span>
                <span className="font-mono text-[9.5px] tabular text-slate-500">
                  {pos ? `${pos.rAU.toFixed(2)} AU` : "—"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 pl-3 font-mono text-[9px] leading-relaxed text-slate-600">
        distanza istantanea
        <br />
        dal Sole · tempo simulato
      </p>
    </nav>
  );
}
