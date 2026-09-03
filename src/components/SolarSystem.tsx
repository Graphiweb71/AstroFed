import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { PLANETS } from "../data/planets";
import type { Planet, OrbitalElements } from "../data/planets";
import { orbitSamples } from "../lib/astro";
import type { HeliocentricPosition } from "../lib/astro";

export type ScaleMode = "compressa" | "reale";

const CX = 600;
const CY = 600;
const BASE = 1200;
const DEG = Math.PI / 180;

function mapRadius(rAU: number, mode: ScaleMode): number {
  return mode === "compressa" ? 58 + 104 * Math.pow(rAU, 0.45) : rAU * 15.2;
}

function orbitPathD(el: OrbitalElements, T: number, mode: ScaleMode): string {
  const pts = orbitSamples(el, T, 180);
  let d = "";
  for (let i = 0; i < pts.length; i++) {
    const R = mapRadius(pts[i].rAU, mode);
    const x = CX + R * Math.cos(pts[i].lambdaRad);
    const y = CY - R * Math.sin(pts[i].lambdaRad);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d + "Z";
}

/* ---------- elementi HUD statici ---------- */
const HudRing = memo(function HudRing() {
  const ticks = useMemo(
    () =>
      Array.from({ length: 72 }, (_, k) => {
        const deg = k * 5;
        const major = k % 6 === 0;
        const a = deg * DEG;
        const r1 = major ? 542 : 549;
        return {
          deg,
          major,
          x1: CX + Math.cos(a) * r1,
          y1: CY - Math.sin(a) * r1,
          x2: CX + Math.cos(a) * 556,
          y2: CY - Math.sin(a) * 556,
          lx: CX + Math.cos(a) * 574,
          ly: CY - Math.sin(a) * 574,
        };
      }),
    [],
  );

  return (
    <g pointerEvents="none">
      {[150, 300, 450].map((r) => (
        <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="#6ee7f2" strokeOpacity="0.045" />
      ))}
      <line x1={CX - 560} y1={CY} x2={CX + 560} y2={CY} stroke="#6ee7f2" strokeOpacity="0.04" />
      <line x1={CX} y1={CY - 560} x2={CX} y2={CY + 560} stroke="#6ee7f2" strokeOpacity="0.04" />
      <circle cx={CX} cy={CY} r={552} fill="none" stroke="#6ee7f2" strokeOpacity="0.12" />
      {ticks.map((t) => (
        <Fragment key={t.deg}>
          <line
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="#6ee7f2"
            strokeOpacity={t.major ? 0.4 : 0.16}
            strokeWidth={t.major ? 1.2 : 0.7}
          />
          {t.major && (
            <text
              x={t.lx}
              y={t.ly + 3}
              textAnchor="middle"
              fontSize="9"
              className="font-mono"
              fill="#6ee7f2"
              fillOpacity="0.32"
            >
              {t.deg}°
            </text>
          )}
        </Fragment>
      ))}
    </g>
  );
});

/* ---------- fascia degli asteroidi ---------- */
interface Asteroid {
  aAU: number;
  ang: number;
  r: number;
  o: number;
}

const AsteroidBelt = memo(function AsteroidBelt({ scaleMode }: { scaleMode: ScaleMode }) {
  const belt = useMemo<Asteroid[]>(
    () =>
      Array.from({ length: 230 }, () => ({
        aAU: (2.06 + Math.random() * 1.3) * (0.965 + Math.random() * 0.07),
        ang: Math.random() * Math.PI * 2,
        r: 0.45 + Math.random() * 0.95,
        o: 0.12 + Math.random() * 0.3,
      })),
    [],
  );

  return (
    <g className="anim-belt" pointerEvents="none">
      {belt.map((b, i) => {
        const R = mapRadius(b.aAU, scaleMode);
        return (
          <circle
            key={i}
            cx={CX + R * Math.cos(b.ang)}
            cy={CY - R * Math.sin(b.ang)}
            r={b.r}
            fill="#9fb4c7"
            opacity={b.o}
          />
        );
      })}
    </g>
  );
});

/* ---------- glifo del pianeta (ologramma vettoriale) ---------- */
interface GlyphProps {
  planet: Planet;
  x: number;
  y: number;
  simDays: number;
  index: number;
  selected: boolean;
  showLabel: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

function PlanetGlyph({ planet, x, y, simDays, index, selected, showLabel, onSelect, onHover }: GlyphProps) {
  const r = planet.displayRadius;
  const phase = (simDays / planet.rotationDays) * Math.PI * 2;
  const meridians = [0, 1, 2, 3].map((k) => Math.abs(Math.cos(phase + (k * Math.PI) / 4)) * r);
  const parallels = [-42, 0, 42].map((lat) => {
    const la = lat * DEG;
    return {
      cy: -Math.sin(la) * r * 0.33,
      rx: Math.cos(la) * r,
      ry: Math.cos(la) * r * 0.33,
    };
  });

  return (
    <g
      transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`}
      className="group/planet group-planet cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onSelect(planet.id);
      }}
      onMouseEnter={() => onHover(planet.id)}
      onMouseLeave={() => onHover(null)}
    >
      <circle r={Math.max(r * 2.1, 15)} fill="transparent" />
      <g className="planet-scale">
        <g className="anim-holo" style={{ "--delay": `${index * 1.15}s` } as CSSProperties}>
          <circle r={r * 2.35} fill={`url(#glow-${planet.id})`} />
          <circle
            r={r}
            fill={`url(#grad-${planet.id})`}
            stroke={planet.colors.light}
            strokeOpacity={0.65}
            strokeWidth={0.8}
          />
          <g
            clipPath={`url(#clip-${planet.id})`}
            fill="none"
            stroke={planet.colors.light}
            strokeOpacity={0.42}
            strokeWidth={0.5}
          >
            {meridians.map((m, k) => (
              <ellipse key={k} rx={Math.max(m, 0.3)} ry={r} />
            ))}
            {parallels.map((p, k) => (
              <ellipse key={k} cy={p.cy} rx={p.rx} ry={p.ry} />
            ))}
          </g>
          <circle r={r} fill="url(#holo-scan)" opacity={0.13} />
          {planet.rings === "saturn" && (
            <g transform="rotate(-16)" fill="none">
              <ellipse rx={r * 2.12} ry={r * 0.56} stroke="#f3e2b3" strokeOpacity="0.85" strokeWidth={1.4} />
              <ellipse rx={r * 1.74} ry={r * 0.45} stroke="#f3e2b3" strokeOpacity="0.28" strokeWidth={3.6} />
              <ellipse rx={r * 1.47} ry={r * 0.37} stroke="#f3e2b3" strokeOpacity="0.42" strokeWidth={0.9} />
            </g>
          )}
          {planet.rings === "uranus" && (
            <g transform="rotate(78)" fill="none">
              <ellipse rx={r * 1.78} ry={r * 0.42} stroke="#bdeef2" strokeOpacity="0.35" strokeWidth={0.9} />
            </g>
          )}
        </g>
      </g>
      {showLabel && (
        <text
          y={r + (planet.rings === "saturn" ? r * 0.72 : 0) + 15}
          textAnchor="middle"
          fontSize="9.5"
          letterSpacing="2.4"
          className={`font-display transition-opacity duration-300 ${
            selected ? "fill-holo-strong opacity-100" : "fill-[#9fdbe8] opacity-70 group-hover/planet:opacity-100"
          }`}
          style={{ pointerEvents: "none" }}
        >
          {planet.nome.toUpperCase()}
        </text>
      )}
    </g>
  );
}

/* ---------- reticolo di selezione ---------- */
function Reticle({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`} pointerEvents="none">
      <g className="anim-spin-slow">
        <circle r={r} fill="none" stroke="#6ee7f2" strokeOpacity="0.9" strokeWidth="1" strokeDasharray="4 10" />
        {[0, 90, 180, 270].map((a) => (
          <line
            key={a}
            x1={0}
            y1={-r - 3}
            x2={0}
            y2={-r - 9}
            stroke="#6ee7f2"
            strokeWidth="1.5"
            transform={`rotate(${a})`}
          />
        ))}
      </g>
      <g className="anim-spin-rev">
        <circle r={r + 7} fill="none" stroke="#6ee7f2" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="30 18 6 18" />
      </g>
    </g>
  );
}

/* ---------- scena principale ---------- */
interface SolarSystemProps {
  simMs: number;
  positions: Map<string, HeliocentricPosition>;
  scaleMode: ScaleMode;
  zoom: number;
  selectedId: string | null;
  showLabels: boolean;
  showOrbits: boolean;
  onSelect: (id: string | null) => void;
  onZoomDelta: (dir: 1 | -1) => void;
}

export default function SolarSystem({
  simMs,
  positions,
  scaleMode,
  zoom,
  selectedId,
  showLabels,
  showOrbits,
  onSelect,
  onZoomDelta,
}: SolarSystemProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      onZoomDelta(e.deltaY < 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onZoomDelta]);

  const T = (simMs / 86400000 + 2440587.5 - 2451545.0) / 36525.0;
  const simDays = simMs / 86400000;
  const size = BASE / zoom;
  const sunR = scaleMode === "compressa" ? 34 : 11;

  const hovered = hoverId && hoverId !== "sole" && hoverId !== selectedId ? PLANETS.find((p) => p.id === hoverId) : null;
  const hoveredPos = hovered ? positions.get(hovered.id) : undefined;

  return (
    <svg
      ref={ref}
      className="absolute inset-0 h-full w-full"
      viewBox={`${CX - size / 2} ${CY - size / 2} ${size} ${size}`}
      preserveAspectRatio="xMidYMid meet"
      onClick={() => onSelect(null)}
    >
      <defs>
        <radialGradient id="grad-sun" cx="40%" cy="36%" r="78%">
          <stop offset="0%" stopColor="#fffdf0" />
          <stop offset="38%" stopColor="#ffe28a" />
          <stop offset="78%" stopColor="#ffb43a" />
          <stop offset="100%" stopColor="#f57f17" />
        </radialGradient>
        <radialGradient id="corona">
          <stop offset="0%" stopColor="#ffcf6e" stopOpacity="0.5" />
          <stop offset="45%" stopColor="#ff9e3a" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ff9e3a" stopOpacity="0" />
        </radialGradient>
        <pattern id="holo-scan" width="4" height="4" patternUnits="userSpaceOnUse">
          <path d="M0 0.6 H4" stroke="#bff3ff" strokeWidth="0.7" opacity="0.5" />
        </pattern>
        {PLANETS.map((p) => (
          <Fragment key={p.id}>
            <radialGradient id={`grad-${p.id}`} cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor={p.colors.light} />
              <stop offset="45%" stopColor={p.colors.base} />
              <stop offset="100%" stopColor={p.colors.deep} />
            </radialGradient>
            <radialGradient id={`glow-${p.id}`}>
              <stop offset="0%" stopColor={p.colors.base} stopOpacity="0.5" />
              <stop offset="55%" stopColor={p.colors.base} stopOpacity="0.14" />
              <stop offset="100%" stopColor={p.colors.base} stopOpacity="0" />
            </radialGradient>
            <clipPath id={`clip-${p.id}`}>
              <circle r={p.displayRadius} />
            </clipPath>
          </Fragment>
        ))}
      </defs>

      <HudRing />
      <AsteroidBelt scaleMode={scaleMode} />

      {/* testi HUD */}
      <g pointerEvents="none">
        <text
          x={CX}
          y={CY - 588}
          textAnchor="middle"
          fontSize="10"
          letterSpacing="3.5"
          className="font-mono"
          fill="#6ee7f2"
          fillOpacity="0.4"
        >
          PIANO ECLITTICO · VISTA DA NORD
        </text>
        <text
          x={CX}
          y={CY + 594}
          textAnchor="middle"
          fontSize="10"
          letterSpacing="2.5"
          className="font-mono"
          fill="#6ee7f2"
          fillOpacity="0.4"
        >
          {scaleMode === "compressa"
            ? "SCALA DISTANZE COMPRESSA (r^0,45) — LE ORBITE NON SONO IN SCALA"
            : "SCALA DISTANZE REALE — USA LO ZOOM PER I PIANETI INTERNI"}
        </text>
      </g>

      {/* orbite */}
      {showOrbits &&
        PLANETS.map((p) => {
          const sel = selectedId === p.id;
          const hov = hoverId === p.id;
          return (
            <path
              key={p.id}
              d={orbitPathD(p.elements, T, scaleMode)}
              fill="none"
              stroke={p.colors.base}
              strokeOpacity={sel ? 0.85 : hov ? 0.5 : 0.22}
              strokeWidth={sel ? 1.4 : 0.8}
              strokeDasharray={sel ? "5 7" : undefined}
              className={sel ? "orbit-active" : undefined}
              style={{ transition: "stroke-opacity 0.3s" }}
            />
          );
        })}

      {/* Sole */}
      <g
        transform={`translate(${CX} ${CY})`}
        className="group-planet cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onSelect("sole");
        }}
        onMouseEnter={() => setHoverId("sole")}
        onMouseLeave={() => setHoverId(null)}
      >
        <circle r={Math.max(sunR * 2, 26)} fill="transparent" />
        <g className="planet-scale">
          <circle r={sunR * 3.1} fill="url(#corona)" className="anim-sun-pulse" />
          <circle
            r={sunR * 1.55}
            fill="none"
            stroke="#ffc65c"
            strokeOpacity="0.4"
            strokeDasharray="2 8"
            className="anim-spin-slow"
          />
          <circle r={sunR} fill="url(#grad-sun)" />
          <circle r={sunR} fill="url(#holo-scan)" opacity="0.12" />
          <circle r={sunR * 0.98} fill="none" stroke="#ffe9b0" strokeOpacity="0.55" strokeWidth="0.8" />
        </g>
        {showLabels && (
          <text
            y={sunR + 20}
            textAnchor="middle"
            fontSize="9.5"
            letterSpacing="2.4"
            className={`font-display ${selectedId === "sole" ? "fill-holo-strong" : "fill-[#ffe1a3]"} opacity-80`}
            style={{ pointerEvents: "none" }}
          >
            SOLE
          </text>
        )}
      </g>

      {/* pianeti */}
      {PLANETS.map((p, i) => {
        const pos = positions.get(p.id);
        if (!pos) return null;
        const R = mapRadius(pos.rAU, scaleMode);
        const x = CX + R * Math.cos(pos.lambdaRad);
        const y = CY - R * Math.sin(pos.lambdaRad);
        return (
          <PlanetGlyph
            key={p.id}
            planet={p}
            x={x}
            y={y}
            simDays={simDays}
            index={i}
            selected={selectedId === p.id}
            showLabel={showLabels}
            onSelect={onSelect}
            onHover={setHoverId}
          />
        );
      })}

      {/* reticolo sul corpo selezionato */}
      {selectedId === "sole" ? (
        <Reticle x={CX} y={CY} r={sunR + 12} />
      ) : selectedId ? (
        (() => {
          const p = PLANETS.find((pl) => pl.id === selectedId);
          const pos = p && positions.get(p.id);
          if (!p || !pos) return null;
          const R = mapRadius(pos.rAU, scaleMode);
          return (
            <Reticle
              x={CX + R * Math.cos(pos.lambdaRad)}
              y={CY - R * Math.sin(pos.lambdaRad)}
              r={p.displayRadius + 9}
            />
          );
        })()
      ) : null}

      {/* tooltip al passaggio del mouse */}
      {hovered && hoveredPos && (
        (() => {
          const R = mapRadius(hoveredPos.rAU, scaleMode);
          const x = CX + R * Math.cos(hoveredPos.lambdaRad);
          const y = CY - R * Math.sin(hoveredPos.lambdaRad);
          return (
            <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)})`} pointerEvents="none">
              <text
                y={-hovered.displayRadius - 22}
                textAnchor="middle"
                fontSize="11.5"
                letterSpacing="1.5"
                className="font-display font-bold"
                fill="#eafcff"
                stroke="#04101c"
                strokeWidth="3.5"
                paintOrder="stroke"
              >
                {hovered.nome.toUpperCase()}
              </text>
              <text
                y={-hovered.displayRadius - 9}
                textAnchor="middle"
                fontSize="9"
                className="font-mono"
                fill="#9fdbe8"
                stroke="#04101c"
                strokeWidth="3"
                paintOrder="stroke"
              >
                r = {hoveredPos.rAU.toFixed(2)} AU
              </text>
            </g>
          );
        })()
      )}
    </svg>
  );
}
