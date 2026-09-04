import { PLANETS } from "../data/planets";
import { centuriesSinceJ2000, heliocentricPosition, orbitSamples } from "./astro";

export interface StarMapOptions {
  dateMs: number;
  title: string;
  invert: boolean; // negativo: sfondo chiaro, tratti scuri
}

const RING = (rAU: number) => 62 + 96 * Math.pow(rAU, 0.44);

const DOT_R: Record<string, number> = {
  mercurio: 4.5,
  venere: 6.5,
  terra: 7,
  marte: 5.5,
  giove: 11,
  saturno: 9.5,
  urano: 8,
  nettuno: 8,
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const SERIF = "Didot, 'Bodoni MT', 'Playfair Display', Georgia, 'Times New Roman', serif";
const SANS = "'Avenir Next', Futura, 'Century Gothic', 'Helvetica Neue', Arial, sans-serif";

/**
 * Genera una mappa celeste vettoriale in bianco e nero:
 * disposizione dei pianeti su una data/ora, stile carta astronomica.
 */
export function buildStarMapSvg({ dateMs, title, invert }: StarMapOptions): string {
  const ink = invert ? "#141414" : "#f2f2ee";
  const bg = invert ? "#f7f6f1" : "#070707";
  const cx = 500;
  const cy = 590;
  const T = centuriesSinceJ2000(dateMs);

  const placed = PLANETS.map((p) => {
    const pos = heliocentricPosition(p.elements, T);
    const lam = ((pos.lambdaRad % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    return { p, lam, R: RING(pos.rAU), rAU: pos.rAU };
  });

  /* etichette: sfalsate quando due pianeti sono vicini in longitudine */
  const order = [...placed].sort((a, b) => a.lam - b.lam);
  const offsets = new Map<string, number>();
  let prevLam = -99;
  let level = 0;
  for (const o of order) {
    const d = (((o.lam - prevLam) * 180) / Math.PI + 360) % 360;
    level = d < 13 ? level + 1 : 0;
    offsets.set(o.p.id, 15 + level * 23);
    prevLam = o.lam;
  }

  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1250" font-family="${SANS}">`,
    `<rect width="1000" height="1250" fill="${bg}"/>`,
    `<rect x="26" y="26" width="948" height="1198" fill="none" stroke="${ink}" stroke-opacity="0.6" stroke-width="1.4"/>`,
    `<rect x="38" y="38" width="924" height="1174" fill="none" stroke="${ink}" stroke-opacity="0.22" stroke-width="0.7"/>`,
  );

  /* intestazione */
  const tUp = esc(title.toUpperCase());
  const tFs = Math.max(22, Math.min(42, Math.floor((880 / Math.max(tUp.length, 1) - 6) / 0.62)));
  out.push(
    `<text x="500" y="104" text-anchor="middle" font-family="${SERIF}" font-size="${tFs}" letter-spacing="6" fill="${ink}">${tUp}</text>`,
    `<path d="M330 132 H480 M520 132 H670 M500 126 L506 132 L500 138 L494 132 Z" fill="${ink}" stroke="${ink}" stroke-width="1"/>`,
  );

  const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" });
  const dateStr = dateFmt.format(dateMs).toUpperCase();
  const timeStr = timeFmt.format(dateMs);
  out.push(
    `<text x="500" y="170" text-anchor="middle" font-size="17" letter-spacing="4" fill="${ink}">${esc(dateStr)} · ORE ${esc(timeStr)}</text>`,
    `<text x="500" y="198" text-anchor="middle" font-size="10.5" letter-spacing="2.6" fill="${ink}" fill-opacity="0.55">IL SISTEMA SOLARE VISTO DAL POLO NORD DELL'ECLITTICA</text>`,
  );

  /* anello graduato */
  const RT = 520;
  for (let deg = 0; deg < 360; deg += 5) {
    const a = (deg * Math.PI) / 180;
    const major = deg % 30 === 0;
    const mid = deg % 15 === 0;
    const r1 = RT - (major ? 15 : mid ? 10 : 6);
    const x1 = cx + Math.cos(a) * r1;
    const y1 = cy - Math.sin(a) * r1;
    const x2 = cx + Math.cos(a) * RT;
    const y2 = cy - Math.sin(a) * RT;
    out.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${ink}" stroke-opacity="${major ? 0.8 : 0.38}" stroke-width="${major ? 1.2 : 0.7}"/>`,
    );
    if (major) {
      const lx = cx + Math.cos(a) * (RT + 26);
      const ly = cy - Math.sin(a) * (RT + 26);
      out.push(
        `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" font-size="12" letter-spacing="1" fill="${ink}" fill-opacity="0.75">${deg}°</text>`,
      );
    }
  }
  out.push(
    `<circle cx="${cx}" cy="${cy}" r="${RT}" fill="none" stroke="${ink}" stroke-opacity="0.8" stroke-width="1.2"/>`,
  );

  /* orbite */
  for (const o of placed) {
    out.push(
      `<circle cx="${cx}" cy="${cy}" r="${o.R.toFixed(1)}" fill="none" stroke="${ink}" stroke-opacity="0.42" stroke-width="0.8"/>`,
    );
  }

  /* Sole */
  out.push(`<circle cx="${cx}" cy="${cy}" r="13" fill="${ink}"/>`);
  for (let k = 0; k < 12; k++) {
    const a = (k * 30 * Math.PI) / 180;
    out.push(
      `<line x1="${(cx + Math.cos(a) * 19).toFixed(1)}" y1="${(cy - Math.sin(a) * 19).toFixed(1)}" x2="${(cx + Math.cos(a) * 28).toFixed(1)}" y2="${(cy - Math.sin(a) * 28).toFixed(1)}" stroke="${ink}" stroke-width="1.3"/>`,
    );
  }
  out.push(
    `<text x="${cx}" y="${cy + 48}" text-anchor="middle" font-size="11" letter-spacing="4" fill="${ink}" fill-opacity="0.85">SOLE</text>`,
  );

  /* pianeti + etichette */
  for (const o of placed) {
    const px = cx + Math.cos(o.lam) * o.R;
    const py = cy - Math.sin(o.lam) * o.R;
    const r = DOT_R[o.p.id] ?? 6;

    if (o.p.id === "saturno") {
      out.push(
        `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${(r * 2).toFixed(1)}" ry="${(r * 0.55).toFixed(1)}" fill="none" stroke="${ink}" stroke-width="1" transform="rotate(-18 ${px.toFixed(1)} ${py.toFixed(1)})"/>`,
      );
    }
    out.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${r}" fill="${ink}"/>`);
    if (o.p.id === "terra") {
      out.push(
        `<circle cx="${(px + r + 5).toFixed(1)}" cy="${(py - r - 4).toFixed(1)}" r="1.8" fill="none" stroke="${ink}" stroke-width="0.9"/>`,
      );
    }

    /* leader + etichetta radiale */
    const off = offsets.get(o.p.id) ?? 15;
    const lx1 = cx + Math.cos(o.lam) * (o.R + r + 3);
    const ly1 = cy - Math.sin(o.lam) * (o.R + r + 3);
    const lx2 = cx + Math.cos(o.lam) * (o.R + off - 4);
    const ly2 = cy - Math.sin(o.lam) * (o.R + off - 4);
    const tx = cx + Math.cos(o.lam) * (o.R + off);
    const ty = cy - Math.sin(o.lam) * (o.R + off);
    const anchor = Math.cos(o.lam) >= 0 ? "start" : "end";
    out.push(
      `<line x1="${lx1.toFixed(1)}" y1="${ly1.toFixed(1)}" x2="${lx2.toFixed(1)}" y2="${ly2.toFixed(1)}" stroke="${ink}" stroke-opacity="0.6" stroke-width="0.8"/>`,
      `<text x="${tx.toFixed(1)}" y="${(ty + 3.5).toFixed(1)}" text-anchor="${anchor}" font-size="12.5" letter-spacing="3" fill="${ink}">${o.p.nome.toUpperCase()}</text>`,
    );
  }

  /* piè di pagina */
  out.push(
    `<text x="500" y="1162" text-anchor="middle" font-size="10" letter-spacing="2.2" fill="${ink}" fill-opacity="0.55">POSIZIONI APPROSSIMATE · ELEMENTI KEPLERIANI MEDI J2000 · LONGITUDINI ELIOCENTRICHE</text>`,
    `<text x="500" y="1186" text-anchor="middle" font-size="10" letter-spacing="2.2" fill="${ink}" fill-opacity="0.4">0° = DIREZIONE DELL'EQUINOZIO DI PRIMAVERA · SENSO ANTIORARIO</text>`,
  );

  out.push("</svg>");
  return out.join("\n");
}

export function starMapFilename(dateMs: number): string {
  const d = new Date(dateMs);
  const p = (n: number) => String(n).padStart(2, "0");
  return `allineamento-planetario-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.svg`;
}

/* ================= variante 3D (vista orbitale corrente) ================= */

export type StarMapScaleMode = "compressa" | "reale";

export interface StarMap3DOptions extends StarMapOptions {
  azDeg: number;
  elDeg: number;
  scaleMode: StarMapScaleMode;
}

/** proiezione ortogonale con la stessa camera della scena */
function ortho(X: number, Y: number, Z: number, az: number, el: number) {
  const ca = Math.cos(az);
  const sa = Math.sin(az);
  const ce = Math.cos(el);
  const se = Math.sin(el);
  const X1 = X * ca + Y * sa;
  const Y1 = -X * sa + Y * ca;
  return { x: X1, y: Y1 * se + Z * ce, depth: Y1 * ce - Z * se };
}

export function buildStarMapSvg3D({ dateMs, title, invert, azDeg, elDeg, scaleMode }: StarMap3DOptions): string {
  const ink = invert ? "#141414" : "#f2f2ee";
  const bg = invert ? "#f7f6f1" : "#070707";
  const cx = 500;
  const cy = 580;
  const T = centuriesSinceJ2000(dateMs);
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;

  const worldR = (rAU: number) =>
    scaleMode === "reale" ? rAU : (58 + 104 * Math.pow(rAU, 0.45)) / 15.2;
  const maxW = scaleMode === "reale" ? 31.6 : 36.6;
  const s = 372 / maxW;

  const toWorld = (x: number, y: number, z: number) => {
    if (scaleMode === "reale") return [x, y, z] as const;
    const r = Math.sqrt(x * x + y * y + z * z);
    const f = worldR(r) / r;
    return [x * f, y * f, z * f] as const;
  };

  const tUp3 = esc(title.toUpperCase());
  const tFs3 = Math.max(22, Math.min(42, Math.floor((880 / Math.max(tUp3.length, 1) - 6) / 0.62)));

  const out: string[] = [];
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1250" font-family="${SANS}">`,
    `<rect width="1000" height="1250" fill="${bg}"/>`,
    `<rect x="26" y="26" width="948" height="1198" fill="none" stroke="${ink}" stroke-opacity="0.6" stroke-width="1.4"/>`,
    `<rect x="38" y="38" width="924" height="1174" fill="none" stroke="${ink}" stroke-opacity="0.22" stroke-width="0.7"/>`,
    `<text x="500" y="104" text-anchor="middle" font-family="${SERIF}" font-size="${tFs3}" letter-spacing="6" fill="${ink}">${tUp3}</text>`,
    `<path d="M330 132 H480 M520 132 H670 M500 126 L506 132 L500 138 L494 132 Z" fill="${ink}" stroke="${ink}" stroke-width="1"/>`,
  );

  const dateFmt = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const timeFmt = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" });
  out.push(
    `<text x="500" y="170" text-anchor="middle" font-size="17" letter-spacing="4" fill="${ink}">${esc(dateFmt.format(dateMs).toUpperCase())} · ORE ${esc(timeFmt.format(dateMs))}</text>`,
    `<text x="500" y="198" text-anchor="middle" font-size="10.5" letter-spacing="2.6" fill="${ink}" fill-opacity="0.55">VISTA ORBITALE TRIDIMENSIONALE · AZIMUT ${Math.round(((azDeg % 360) + 360) % 360)}° · ELEVAZIONE ${Math.round(elDeg)}°</text>`,
  );

  /* orbite proiettate */
  for (const p of PLANETS) {
    const pts: string[] = [];
    const samples = orbitSamples(p.elements, T, 200);
    for (const sm of samples) {
      const w = toWorld(sm.xAU, sm.yAU, sm.zAU);
      const pr = ortho(w[0], w[1], w[2], az, el);
      pts.push(`${(cx + pr.x * s).toFixed(1)},${(cy - pr.y * s).toFixed(1)}`);
    }
    out.push(
      `<polygon points="${pts.join(" ")}" fill="none" stroke="${ink}" stroke-opacity="0.45" stroke-width="0.8"/>`,
    );
  }

  /* pianeti con profondità */
  const bodies = PLANETS.map((p) => {
    const pos = heliocentricPosition(p.elements, T);
    const w = toWorld(pos.xAU, pos.yAU, pos.zAU);
    const pr = ortho(w[0], w[1], w[2], az, el);
    return { p, sx: cx + pr.x * s, sy: cy - pr.y * s, depth: pr.depth };
  });
  const back = bodies.filter((b) => b.depth < 0);
  const front = bodies.filter((b) => b.depth >= 0);

  const drawPlanet = (b: (typeof bodies)[number]) => {
    const r = (DOT_R[b.p.id] ?? 6) * 0.92;
    const behind = b.depth < 0;
    const op = behind ? 0.5 : 1;
    if (b.p.id === "saturno") {
      out.push(
        `<ellipse cx="${b.sx.toFixed(1)}" cy="${b.sy.toFixed(1)}" rx="${(r * 2).toFixed(1)}" ry="${(r * 0.55).toFixed(1)}" fill="none" stroke="${ink}" stroke-opacity="${op}" stroke-width="1" transform="rotate(-18 ${b.sx.toFixed(1)} ${b.sy.toFixed(1)})"/>`,
      );
    }
    out.push(
      `<circle cx="${b.sx.toFixed(1)}" cy="${b.sy.toFixed(1)}" r="${r}" fill="${ink}" fill-opacity="${op}"/>`,
    );
    const anchorRight = b.sx <= 780;
    const tx = anchorRight ? b.sx + r + 10 : b.sx - r - 10;
    const anchor = anchorRight ? "start" : "end";
    out.push(
      `<line x1="${(b.sx + (anchorRight ? r + 2 : -r - 2)).toFixed(1)}" y1="${(b.sy - 2).toFixed(1)}" x2="${(tx - (anchorRight ? 4 : -4)).toFixed(1)}" y2="${(b.sy - 2).toFixed(1)}" stroke="${ink}" stroke-opacity="0.55" stroke-width="0.7"/>`,
      `<text x="${tx.toFixed(1)}" y="${(b.sy + 2.5).toFixed(1)}" text-anchor="${anchor}" font-size="12.5" letter-spacing="3" fill="${ink}" fill-opacity="${behind ? 0.65 : 1}">${b.p.nome.toUpperCase()}</text>`,
    );
  };

  back.forEach(drawPlanet);

  /* Sole al centro */
  out.push(`<circle cx="${cx}" cy="${cy}" r="12" fill="${ink}"/>`);
  for (let k = 0; k < 12; k++) {
    const a = (k * 30 * Math.PI) / 180;
    out.push(
      `<line x1="${(cx + Math.cos(a) * 17).toFixed(1)}" y1="${(cy - Math.sin(a) * 17).toFixed(1)}" x2="${(cx + Math.cos(a) * 25).toFixed(1)}" y2="${(cy - Math.sin(a) * 25).toFixed(1)}" stroke="${ink}" stroke-width="1.2"/>`,
    );
  }
  out.push(
    `<text x="${cx}" y="${cy + 44}" text-anchor="middle" font-size="11" letter-spacing="4" fill="${ink}" fill-opacity="0.85">SOLE</text>`,
  );

  front.forEach(drawPlanet);

  out.push(
    `<text x="500" y="1162" text-anchor="middle" font-size="10" letter-spacing="2.2" fill="${ink}" fill-opacity="0.55">POSIZIONI APPROSSIMATE · ELEMENTI KEPLERIANI MEDI J2000 · ${scaleMode === "reale" ? "SCALE REALI" : "DISTANZE COMPRESSE"}</text>`,
    `<text x="500" y="1186" text-anchor="middle" font-size="10" letter-spacing="2.2" fill="${ink}" fill-opacity="0.4">PIANO ECLITTICO ORIZZONTALE · IL SOLE È FISSO AL CENTRO</text>`,
  );

  out.push("</svg>");
  return out.join("\n");
}
