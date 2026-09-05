export interface OrbitalElements {
  /** Elementi kepleriani medi J2000 (JPL, validi 1800–2050) + tassi per secolo */
  a: number;      // semiasse maggiore (AU)
  e: number;      // eccentricità
  i: number;      // inclinazione (°)
  L: number;      // longitudine media (°)
  peri: number;   // longitudine del perielio (°)
  node: number;   // longitudine del nodo ascendente (°)
  rates: { a: number; e: number; i: number; L: number; peri: number; node: number };
}

export interface PlanetInfo {
  diametroKm: number;
  distanzaMediaAU: number;
  periodoGiorni: number;
  periodoLabel: string;
  velocitaKms: number;
  temperatura: string;
  satelliti: number;
  rotazione: string;
  curiosita: string;
}

export interface Planet {
  id: string;
  nome: string;
  tipo: string;
  colors: { light: string; base: string; deep: string };
  displayRadius: number;
  rotationDays: number; // negativa = retrograda
  rings?: "saturn" | "uranus";
  elements: OrbitalElements;
  info: PlanetInfo;
}

export const PLANETS: Planet[] = [
  {
    id: "mercurio",
    nome: "Mercurio",
    tipo: "Pianeta roccioso",
    colors: { light: "#d9e6f2", base: "#9fb4c7", deep: "#2c3b4a" },
    displayRadius: 5.5,
    rotationDays: 58.65,
    elements: {
      a: 0.38709927, e: 0.20563593, i: 7.00497902, L: 252.2503235,
      peri: 77.45779628, node: 48.33076593,
      rates: { a: 0.00000037, e: 0.00001906, i: -0.00594749, L: 149472.67411175, peri: 0.16047689, node: -0.12534081 },
    },
    info: {
      diametroKm: 4879,
      distanzaMediaAU: 0.387,
      periodoGiorni: 88,
      periodoLabel: "88 giorni",
      velocitaKms: 47.4,
      temperatura: "−173 / +427 °C",
      satelliti: 0,
      rotazione: "58,6 giorni",
      curiosita:
        "Un giorno solare su Mercurio dura 176 giorni terrestri: più del doppio del suo anno. È il pianeta con l’escursione termica più estrema del Sistema Solare.",
    },
  },
  {
    id: "venere",
    nome: "Venere",
    tipo: "Pianeta roccioso",
    colors: { light: "#ffe9bf", base: "#f2c57d", deep: "#6e4a14" },
    displayRadius: 7.5,
    rotationDays: -243.02,
    elements: {
      a: 0.72333566, e: 0.00677672, i: 3.39467605, L: 181.9790995,
      peri: 131.60246718, node: 76.67984255,
      rates: { a: 0.0000039, e: -0.00004107, i: -0.0007889, L: 58517.81538729, peri: 0.00268329, node: -0.27769418 },
    },
    info: {
      diametroKm: 12104,
      distanzaMediaAU: 0.723,
      periodoGiorni: 224.7,
      periodoLabel: "224,7 giorni",
      velocitaKms: 35.0,
      temperatura: "+464 °C (media)",
      satelliti: 0,
      rotazione: "243 giorni (retrograda)",
      curiosita:
        "Ruota in senso opposto rispetto alla maggior parte dei pianeti: su Venere il Sole sorge a ovest. La sua densa atmosfera di CO₂ ne fa il pianeta più caldo.",
    },
  },
  {
    id: "terra",
    nome: "Terra",
    tipo: "Pianeta roccioso",
    colors: { light: "#c8eaff", base: "#5fb7ff", deep: "#123a68" },
    displayRadius: 8,
    rotationDays: 0.997,
    elements: {
      a: 1.00000261, e: 0.01671123, i: -0.00001531, L: 100.46457166,
      peri: 102.93768193, node: 0.0,
      rates: { a: 0.00000562, e: -0.00004392, i: -0.01294668, L: 35999.37244981, peri: 0.32327364, node: 0.0 },
    },
    info: {
      diametroKm: 12742,
      distanzaMediaAU: 1.0,
      periodoGiorni: 365.25,
      periodoLabel: "365,25 giorni",
      velocitaKms: 29.8,
      temperatura: "+15 °C (media)",
      satelliti: 1,
      rotazione: "23,9 ore",
      curiosita:
        "L’unico mondo conosciuto con acqua liquida stabile in superficie: gli oceani coprono il 71% del pianeta. La Luna ne stabilizza l’asse di rotazione.",
    },
  },
  {
    id: "marte",
    nome: "Marte",
    tipo: "Pianeta roccioso",
    colors: { light: "#ffc9ab", base: "#f0804f", deep: "#6e2810" },
    displayRadius: 6.2,
    rotationDays: 1.026,
    elements: {
      a: 1.52371034, e: 0.0933941, i: 1.84969142, L: -4.55343205,
      peri: -23.94362959, node: 49.55953891,
      rates: { a: 0.00001847, e: 0.00007882, i: -0.00813131, L: 19140.30268499, peri: 0.44441088, node: -0.29257343 },
    },
    info: {
      diametroKm: 6779,
      distanzaMediaAU: 1.524,
      periodoGiorni: 687,
      periodoLabel: "687 giorni (1,9 anni)",
      velocitaKms: 24.1,
      temperatura: "−63 °C (media)",
      satelliti: 2,
      rotazione: "24,6 ore",
      curiosita:
        "Ospita l’Olympus Mons, il vulcano più alto del Sistema Solare: quasi 22 km, circa tre volte l’Everest. Le sue calotte polari sono di ghiaccio e CO₂.",
    },
  },
  {
    id: "giove",
    nome: "Giove",
    tipo: "Gigante gassoso",
    colors: { light: "#ffe8c7", base: "#e0b183", deep: "#5f3c1c" },
    displayRadius: 17,
    rotationDays: 0.414,
    elements: {
      a: 5.202887, e: 0.04838624, i: 1.30439695, L: 34.39644051,
      peri: 14.72847983, node: 100.47390909,
      rates: { a: -0.00011607, e: -0.00013253, i: -0.00183714, L: 3034.74612775, peri: 0.21252668, node: 0.20469106 },
    },
    info: {
      diametroKm: 139820,
      distanzaMediaAU: 5.203,
      periodoGiorni: 4333,
      periodoLabel: "4.333 giorni (11,9 anni)",
      velocitaKms: 13.1,
      temperatura: "−108 °C",
      satelliti: 95,
      rotazione: "9,9 ore",
      curiosita:
        "La Grande Macchia Rossa è una tempesta più grande della Terra, osservata da almeno 350 anni. Giove è il pianeta più rapido a ruotare su sé stesso.",
    },
  },
  {
    id: "saturno",
    nome: "Saturno",
    tipo: "Gigante gassoso",
    colors: { light: "#fff3d2", base: "#edd49b", deep: "#6b4d1b" },
    displayRadius: 14.5,
    rotationDays: 0.444,
    rings: "saturn",
    elements: {
      a: 9.53667594, e: 0.05386179, i: 2.48599187, L: 49.95424423,
      peri: 92.59887831, node: 113.66242448,
      rates: { a: -0.0012506, e: -0.00050991, i: 0.00193609, L: 1222.49362201, peri: -0.41897216, node: -0.28867794 },
    },
    info: {
      diametroKm: 116460,
      distanzaMediaAU: 9.537,
      periodoGiorni: 10759,
      periodoLabel: "10.759 giorni (29,5 anni)",
      velocitaKms: 9.7,
      temperatura: "−139 °C",
      satelliti: 146,
      rotazione: "10,7 ore",
      curiosita:
        "La sua densità media è inferiore a quella dell’acqua: galleggerebbe, se esistesse un oceano abbastanza grande. I suoi anelli sono fatti per il 99% di ghiaccio.",
    },
  },
  {
    id: "urano",
    nome: "Urano",
    tipo: "Gigante di ghiaccio",
    colors: { light: "#e2fcff", base: "#9fe8ef", deep: "#205a63" },
    displayRadius: 10.5,
    rotationDays: -0.718,
    rings: "uranus",
    elements: {
      a: 19.18916464, e: 0.04725744, i: 0.77263783, L: 313.23810451,
      peri: 170.9542763, node: 74.01692503,
      rates: { a: -0.00196176, e: -0.00004397, i: -0.00242939, L: 428.48202785, peri: 0.40805281, node: 0.04240589 },
    },
    info: {
      diametroKm: 50724,
      distanzaMediaAU: 19.19,
      periodoGiorni: 30687,
      periodoLabel: "30.687 giorni (84 anni)",
      velocitaKms: 6.8,
      temperatura: "−197 °C",
      satelliti: 28,
      rotazione: "17,2 ore (retrograda)",
      curiosita:
        "Il suo asse è inclinato di 98°: ruota praticamente “sdraiato”, rotolando lungo l’orbita. Ogni polo vive 42 anni di luce seguiti da 42 anni di buio.",
    },
  },
  {
    id: "nettuno",
    nome: "Nettuno",
    tipo: "Gigante di ghiaccio",
    colors: { light: "#cddcff", base: "#7fa8ff", deep: "#1a3370" },
    displayRadius: 10.2,
    rotationDays: 0.671,
    elements: {
      a: 30.06992276, e: 0.00859048, i: 1.77004347, L: -55.12002969,
      peri: 44.96476227, node: 131.78422574,
      rates: { a: 0.00026291, e: 0.00005105, i: 0.00035372, L: 218.45945325, peri: -0.32241464, node: -0.00508664 },
    },
    info: {
      diametroKm: 49244,
      distanzaMediaAU: 30.07,
      periodoGiorni: 60190,
      periodoLabel: "60.190 giorni (164,8 anni)",
      velocitaKms: 5.4,
      temperatura: "−201 °C",
      satelliti: 16,
      rotazione: "16,1 ore",
      curiosita:
        "Qui soffiano i venti più veloci del Sistema Solare, oltre 2.100 km/h. Fu il primo pianeta scoperto grazie al calcolo matematico, nel 1846.",
    },
  },
];

export interface SunData {
  id: "sole";
  nome: string;
  tipo: string;
  diametroKm: number;
  massa: string;
  tempSuperficie: string;
  tempNucleo: string;
  rotazione: string;
  eta: string;
  composizione: { nome: string; pct: number }[];
  curiosita: string;
}

export const SUN: SunData = {
  id: "sole",
  nome: "Sole",
  tipo: "Stella · nana gialla (G2V)",
  diametroKm: 1392700,
  massa: "1,989 × 10³⁰ kg (99,86% del sistema)",
  tempSuperficie: "5.505 °C",
  tempNucleo: "≈ 15.000.000 °C",
  rotazione: "≈ 27 giorni (equatore)",
  eta: "≈ 4,6 miliardi di anni",
  composizione: [
    { nome: "Idrogeno", pct: 73.4 },
    { nome: "Elio", pct: 24.9 },
    { nome: "Altri elementi", pct: 1.7 },
  ],
  curiosita:
    "La luce che vedi impiega 8 minuti e 20 secondi per viaggiare dal Sole alla Terra. Ogni secondo fonde circa 600 milioni di tonnellate di idrogeno.",
};

export interface SpeedOption {
  label: string;
  /** giorni di simulazione per ogni secondo reale */
  daysPerSecond: number;
}

export const SPEEDS: SpeedOption[] = [
  { label: "1 min/s", daysPerSecond: 1 / 1440 },
  { label: "1 h/s", daysPerSecond: 1 / 24 },
  { label: "1 giorno/s", daysPerSecond: 1 },
  { label: "1 sett/s", daysPerSecond: 7 },
  { label: "1 mese/s", daysPerSecond: 30.437 },
  { label: "1 anno/s", daysPerSecond: 365.25 },
];

export const DEFAULT_SPEED_INDEX = 2;
export const AU_TO_MLN_KM = 149.598;
