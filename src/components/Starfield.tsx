import { memo, useMemo } from "react";
import type { CSSProperties } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  dur: number;
  delay: number;
  o: number;
  twinkle: boolean;
}

const Starfield = memo(function Starfield() {
  const stars = useMemo<Star[]>(
    () =>
      Array.from({ length: 190 }, () => ({
        x: Math.random() * 1600,
        y: Math.random() * 900,
        r: 0.35 + Math.random() * 1.15,
        dur: 3 + Math.random() * 6.5,
        delay: -Math.random() * 9,
        o: 0.18 + Math.random() * 0.4,
        twinkle: Math.random() > 0.34,
      })),
    [],
  );

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="neb-teal" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1b6d84" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#1b6d84" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="neb-ember" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7a4a1c" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#7a4a1c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="neb-blue" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#17325f" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#17325f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="vignette" cx="50%" cy="50%" r="72%">
          <stop offset="0%" stopColor="#02060d" stopOpacity="0" />
          <stop offset="72%" stopColor="#02060d" stopOpacity="0" />
          <stop offset="100%" stopColor="#02060d" stopOpacity="0.75" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill="#040a14" />
      <ellipse cx="300" cy="190" rx="500" ry="310" fill="url(#neb-teal)" />
      <ellipse cx="1360" cy="760" rx="540" ry="350" fill="url(#neb-ember)" />
      <ellipse cx="880" cy="430" rx="720" ry="430" fill="url(#neb-blue)" />

      {stars.map((s, i) =>
        s.twinkle ? (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#cfeaff"
            className="anim-twinkle"
            style={{ "--dur": `${s.dur}s`, "--delay": `${s.delay}s` } as CSSProperties}
          />
        ) : (
          <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.8} fill="#9db8d6" opacity={s.o} />
        ),
      )}

      <rect width="1600" height="900" fill="url(#vignette)" />
    </svg>
  );
});

export default Starfield;
