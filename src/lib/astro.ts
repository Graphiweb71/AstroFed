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
  xAU: number;
  yAU: number;
}

/**
 * Posizione eliocentrica approssimata (elementi kepleriani medi J2000,
 * approssimazione JPL di E. Standish, valida 1800–2050).
 */
export function heliocentricPosition(el: OrbitalElements, T: number): HeliocentricPosition {
  const a = el.a + el.rates.a * T;
  const e = el.e + el.rates.e * T;
  const L = el.L + el.rates.L * T;
  const peri = el.peri + el.rates.peri * T;

  const M = norm360(L - peri) * DEG;
  const E = solveKepler(M, e);
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2),
  );
  const rAU = a * (1 - e * Math.cos(E));
  const lambdaRad = nu + peri * DEG;

  return {
    rAU,
    lambdaRad,
    xAU: rAU * Math.cos(lambdaRad),
    yAU: rAU * Math.sin(lambdaRad),
  };
}

export interface OrbitSample {
  rAU: number;
  lambdaRad: number;
}

/** Campioni dell'orbita completa (parametrizzata per anomalia eccentrica) */
export function orbitSamples(el: OrbitalElements, T: number, samples = 180): OrbitSample[] {
  const a = el.a + el.rates.a * T;
  const e = el.e + el.rates.e * T;
  const peri = (el.peri + el.rates.peri * T) * DEG;

  const pts: OrbitSample[] = [];
  for (let k = 0; k <= samples; k++) {
    const E = (k / samples) * Math.PI * 2;
    const nu = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2),
    );
    pts.push({ rAU: a * (1 - e * Math.cos(E)), lambdaRad: nu + peri });
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
