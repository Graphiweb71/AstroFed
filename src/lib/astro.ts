import type { OrbitalElements } from "../data/planets";

const DEG = Math.PI / 180;

/** Giorno giuliano a partire da millisecondi epoch */
export function julianDay(ms: number): number {
  return ms / 86400000 + 2440587.5;
}

/** Secoli giuliani da J2000.0 */
export function centuriesSinceJ2000(ms: number): number {
  return (julianDay(ms) - 2451545.0) / 36525.0;
}

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

/** Risolve l'equazione di Keplero E − e·sin(E) = M con Newton-Raphson */
function solveKepler(Mrad: number, e: number): number {
  let E = Mrad + e * Math.sin(Mrad);
  for (let k = 0; k < 8; k++) {
    const f = E - e * Math.sin(E) - Mrad;
    E -= f / (1 - e * Math.cos(E));
  }
  return E;
}

export interface HeliocentricPosition {
  /** distanza istantanea dal Sole in AU */
  rAU: number;
  /** longitudine eliocentrica nel piano dell'eclittica (radianti) */
  lambdaRad: number;
  /** coordinate eliocentriche eclittiche (AU), Z verso il polo nord eclittico */
  xAU: number;
  yAU: number;
  zAU: number;
}

/**
 * Posizione eliocentrica approssimata (elementi kepleriani medi J2000,
 * approssimazione JPL di E. Standish, valida 1800–2050), con inclinazione
 * e nodo ascendente: coordinate eclittiche complete X, Y, Z.
 */
export function heliocentricPosition(el: OrbitalElements, T: number): HeliocentricPosition {
  const a = el.a + el.rates.a * T;
  const e = el.e + el.rates.e * T;
  const L = el.L + el.rates.L * T;
  const peri = el.peri + el.rates.peri * T;
  const node = (el.node + el.rates.node * T) * DEG;
  const incl = (el.i + el.rates.i * T) * DEG;

  const M = norm360(L - peri) * DEG;
  const E = solveKepler(M, e);
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2),
  );
  const rAU = a * (1 - e * Math.cos(E));
  const lambdaRad = nu + peri * DEG;

  const u = nu + peri * DEG - node; // argomento di latitudine
  const cosU = Math.cos(u);
  const sinU = Math.sin(u);
  const cosN = Math.cos(node);
  const sinN = Math.sin(node);
  const cosI = Math.cos(incl);
  const sinI = Math.sin(incl);

  return {
    rAU,
    lambdaRad,
    xAU: rAU * (cosN * cosU - sinN * sinU * cosI),
    yAU: rAU * (sinN * cosU + cosN * sinU * cosI),
    zAU: rAU * (sinU * sinI),
  };
}

export interface OrbitSample {
  xAU: number;
  yAU: number;
  zAU: number;
}

/** Campioni dell'orbita completa in coordinate eclittiche 3D (anomalia eccentrica) */
export function orbitSamples(el: OrbitalElements, T: number, samples = 180): OrbitSample[] {
  const a = el.a + el.rates.a * T;
  const e = el.e + el.rates.e * T;
  const peri = (el.peri + el.rates.peri * T) * DEG;
  const node = (el.node + el.rates.node * T) * DEG;
  const incl = (el.i + el.rates.i * T) * DEG;
  const argPeri = peri - node;
  const cosN = Math.cos(node);
  const sinN = Math.sin(node);
  const cosI = Math.cos(incl);
  const sinI = Math.sin(incl);

  const pts: OrbitSample[] = [];
  for (let k = 0; k <= samples; k++) {
    const E = (k / samples) * Math.PI * 2;
    const nu = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2),
    );
    const r = a * (1 - e * Math.cos(E));
    const u = nu + argPeri;
    const cosU = Math.cos(u);
    const sinU = Math.sin(u);
    pts.push({
      xAU: r * (cosN * cosU - sinN * sinU * cosI),
      yAU: r * (sinN * cosU + cosN * sinU * cosI),
      zAU: r * (sinU * sinI),
    });
  }
  return pts;
}

/* ---------- formattazione (locale it-IT) ---------- */

const nfCache = new Map<number, Intl.NumberFormat>();
export function formatNumber(value: number, maxDigits = 0): string {
  let nf = nfCache.get(maxDigits);
  if (!nf) {
    nf = new Intl.NumberFormat("it-IT", {
      maximumFractionDigits: maxDigits,
      minimumFractionDigits: 0,
    });
    nfCache.set(maxDigits, nf);
  }
  return nf.format(value);
}

export function toLocalInputValue(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
