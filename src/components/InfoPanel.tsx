import { AU_TO_MLN_KM, PLANETS, SUN } from "../data/planets";
import type { Planet } from "../data/planets";
import { formatNumber } from "../lib/astro";
import type { HeliocentricPosition } from "../lib/astro";

interface Props {
  selectedId: string | null;
  position: HeliocentricPosition | null;
  deckHeight: number;
  onClose: () => void;
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.06] py-[9px]">
      <dt className="text-[10.5px] uppercase tracking-[0.14em] text-slate-400">{label}</dt>
      <dd className="text-right">
        <span className="font-mono text-[13px] font-medium text-slate-100">{value}</span>
        {sub && <span className="block font-mono text-[10px] text-slate-500">{sub}</span>}
      </dd>
    </div>
  );
}

function PlanetCard({ planet, position }: { planet: Planet; position: HeliocentricPosition | null }) {
  const info = planet.info;
  const earthRatio = info.diametroKm / 12742;
  const barPct = Math.min(100, Math.pow(earthRatio, 0.4) * 100);
  const lambdaDeg = position
    ? (((position.lambdaRad * 180) / Math.PI) % 360 + 360) % 360
    : null;

  return (
    <>
      <div className="border border-holo/25 bg-holo/[0.06] p-3">
        <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.25em] text-holo/80">
          <span className="inline-block h-1.5 w-1.5 bg-holo" />
          IN QUESTO MOMENTO
        </p>
        {position ? (
          <>
            <p className="font-display text-[19px] font-bold tabular tracking-wide text-holo-strong">
              {position.rAU.toFixed(3)} AU
            </p>
            <p className="text-[11px] text-slate-400">
              ≈ {formatNumber(position.rAU * AU_TO_MLN_KM, 1)} mln km dal Sole
            </p>
            {lambdaDeg !== null && (
              <p className="mt-1 font-mono text-[10px] text-slate-500">
                longitudine eliocentrica {lambdaDeg.toFixed(1)}°
              </p>
            )}
          </>
        ) : (
          <p className="font-mono text-[11px] text-slate-500">dato non disponibile</p>
        )}
      </div>

      <dl className="mt-2">
        <Row
          label="Diametro"
          value={`${formatNumber(info.diametroKm)} km`}
          sub={earthRatio !== 1 ? `${formatNumber(earthRatio, earthRatio < 1 ? 2 : 1)}× la Terra` : undefined}
        />
        <Row
          label="Distanza media"
          value={`${formatNumber(info.distanzaMediaAU, 3)} AU`}
          sub={`${formatNumber(info.distanzaMediaAU * AU_TO_MLN_KM, 1)} mln km`}
        />
        <Row
          label="Periodo orbitale"
          value={info.periodoLabel}
          sub={`${formatNumber(info.periodoGiorni)} giorni`}
        />
        <Row label="Velocità orbitale" value={`${formatNumber(info.velocitaKms, 1)} km/s`} />
        <Row label="Rotazione (giorno)" value={info.rotazione} />
        <Row label="Temperatura" value={info.temperatura} />
        <Row label="Satelliti noti" value={formatNumber(info.satelliti)} />
      </dl>

      <div className="mt-4">
        <p className="mb-1.5 font-mono text-[9.5px] tracking-[0.22em] text-slate-500">
          DIAMETRO RELATIVO · TERRA = 100
        </p>
        <div className="h-[7px] w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${barPct}%`,
              background: `linear-gradient(90deg, ${planet.colors.deep}, ${planet.colors.base})`,
              boxShadow: `0 0 10px ${planet.colors.base}`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 border-l-2 border-holo/60 bg-holo/[0.05] p-3">
        <p className="mb-1 font-mono text-[9.5px] tracking-[0.25em] text-holo/80">LO SAPEVI?</p>
        <p className="text-[12.5px] leading-relaxed text-slate-300">{info.curiosita}</p>
      </div>
    </>
  );
}

function SunCard() {
  const barColors = ["#ffc65c", "#ff9e5c", "#7fa8ff"];
  return (
    <>
      <div className="border border-solar/25 bg-solar/[0.06] p-3">
        <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[9.5px] tracking-[0.25em] text-solar/90">
          <span className="inline-block h-1.5 w-1.5 bg-solar" />
          CENTRO DEL SISTEMA
        </p>
        <p className="text-[12px] leading-relaxed text-slate-300">
          Tutti e otto i pianeti orbitano attorno a questa stella, che da sola contiene il 99,86% della
          massa del Sistema Solare.
        </p>
      </div>

      <dl className="mt-2">
        <Row label="Diametro" value={`${formatNumber(SUN.diametroKm)} km`} sub="109× la Terra" />
        <Row label="Massa" value={SUN.massa} />
        <Row label="Temp. superficie" value={SUN.tempSuperficie} />
        <Row label="Temp. nucleo" value={SUN.tempNucleo} />
        <Row label="Rotazione" value={SUN.rotazione} />
        <Row label="Età" value={SUN.eta} />
      </dl>

      <div className="mt-4">
        <p className="mb-2 font-mono text-[9.5px] tracking-[0.22em] text-slate-500">COMPOSIZIONE</p>
        <div className="space-y-2.5">
          {SUN.composizione.map((c, i) => (
            <div key={c.nome}>
              <div className="mb-1 flex justify-between font-mono text-[10.5px]">
                <span className="text-slate-300">{c.nome}</span>
                <span className="tabular text-slate-500">{formatNumber(c.pct, 1)}%</span>
              </div>
              <div className="h-[6px] w-full overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${c.pct}%`, background: barColors[i], boxShadow: `0 0 8px ${barColors[i]}` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-l-2 border-solar/60 bg-solar/[0.05] p-3">
        <p className="mb-1 font-mono text-[9.5px] tracking-[0.25em] text-solar/90">LO SAPEVI?</p>
        <p className="text-[12.5px] leading-relaxed text-slate-300">{SUN.curiosita}</p>
      </div>
    </>
  );
}

export default function InfoPanel({ selectedId, position, deckHeight, onClose }: Props) {
  const open = selectedId !== null;
  const planet =
    selectedId && selectedId !== "sole" ? PLANETS.find((p) => p.id === selectedId) ?? null : null;
  const isSun = selectedId === "sole";
  const nome = isSun ? SUN.nome : planet?.nome ?? "";
  const tipo = isSun ? SUN.tipo : planet?.tipo ?? "";
  const colors = isSun
    ? { light: "#fffdf0", base: "#ffc65c", deep: "#f57f17" }
    : planet?.colors ?? { light: "#fff", base: "#888", deep: "#333" };

  return (
    <aside
      className={`absolute right-3 top-[104px] z-30 w-[318px] max-w-[86vw] transition-all duration-300 md:right-5 md:top-[108px] md:w-[336px] ${
        open ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-10 opacity-0"
      }`}
      style={{ bottom: deckHeight + 14 }}
    >
      <div className="bracket flex h-full flex-col overflow-hidden border border-holo/15 bg-panel/85 backdrop-blur-md">
        <div key={selectedId ?? "none"} className="panel-scroll anim-fade-up flex-1 overflow-y-auto p-4 md:p-5">
          <div className="mb-4 flex items-start gap-3.5 pr-7">
            <span
              className="mt-0.5 h-11 w-11 shrink-0 rounded-full"
              style={{
                background: `radial-gradient(circle at 34% 30%, ${colors.light}, ${colors.base} 55%, ${colors.deep})`,
                boxShadow: `0 0 18px ${colors.base}66, 0 0 4px ${colors.base}`,
              }}
            />
            <div>
              <h2 className="font-display text-[21px] font-extrabold leading-tight tracking-[0.12em] text-slate-50">
                {nome.toUpperCase()}
              </h2>
              <p className="mt-0.5 text-[10.5px] uppercase tracking-[0.2em] text-slate-400">{tipo}</p>
            </div>
          </div>

          {isSun ? <SunCard /> : planet ? <PlanetCard planet={planet} position={position} /> : null}

          <p className="mt-5 border-t border-white/[0.06] pt-3 font-mono text-[9px] leading-relaxed text-slate-600">
            Posizioni calcolate con elementi kepleriani medi J2000 (approssimazione JPL, E. Standish) ·
            validità 1800–2050.
          </p>
        </div>

        <button
          onClick={onClose}
          aria-label="Chiudi scheda"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center text-slate-400 transition-colors hover:text-holo"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
