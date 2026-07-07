// ─── FogMap ──────────────────────────────────────────────────────────────────
// The soul of the product: a surveyor's chart where fog lifts only over
// terrain you've actually understood. Pure SVG — no canvas, no game engine.
// Zones are generated from centers + a deterministic wobble so the shapes
// feel hand-drawn without shipping hand-drawn assets.

interface Zone {
  id: string;
  name: string;
  cx: number;
  cy: number;
  r: number;
  icon: "waves" | "trees" | "keep" | "camp" | "boulders" | "peak";
}

const ZONES: Zone[] = [
  { id: "z1", name: "The Landing", cx: 135, cy: 352, r: 52, icon: "waves" },
  { id: "z2", name: "The Present Hour", cx: 248, cy: 300, r: 50, icon: "trees" },
  { id: "z3", name: "The Inner Keep", cx: 356, cy: 348, r: 50, icon: "keep" },
  { id: "z4", name: "First Light Camp", cx: 438, cy: 252, r: 50, icon: "camp" },
  { id: "z5", name: "The Blocked Pass", cx: 340, cy: 172, r: 48, icon: "boulders" },
  { id: "z6", name: "The Summit", cx: 476, cy: 104, r: 46, icon: "peak" }
];

// Deterministic "hand-drawn" blob: 8 points around the center, each nudged by
// a fixed per-zone offset pattern, joined with smooth quadratic curves.
const WOBBLE = [1.0, 0.82, 1.08, 0.9, 1.05, 0.8, 1.1, 0.88];
function blobPath(cx: number, cy: number, r: number, seed: number): string {
  const pts: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + seed * 0.7;
    const rad = r * WOBBLE[(i + seed) % 8];
    pts.push([cx + Math.cos(angle) * rad, cy + Math.sin(angle) * rad * 0.78]);
  }
  let d = `M ${(pts[0][0] + pts[7][0]) / 2} ${(pts[0][1] + pts[7][1]) / 2}`;
  for (let i = 0; i < 8; i++) {
    const p = pts[i];
    const next = pts[(i + 1) % 8];
    d += ` Q ${p[0]} ${p[1]} ${(p[0] + next[0]) / 2} ${(p[1] + next[1]) / 2}`;
  }
  return d + " Z";
}

const TERRAIN_FILL = ["#D9C79E", "#D2BE93", "#DCCBA4", "#CFBA8E", "#D6C298", "#C9B384"];

function ZoneIcon({ zone }: { zone: Zone }) {
  const { cx, cy, icon } = zone;
  const s = "stroke-[#5d4f33]";
  switch (icon) {
    case "waves":
      return (
        <g className={s} strokeWidth="2" fill="none" strokeLinecap="round">
          <path d={`M ${cx - 22} ${cy} q 6 -7 12 0 q 6 7 12 0`} />
          <path d={`M ${cx - 16} ${cy + 11} q 6 -7 12 0 q 6 7 12 0`} />
        </g>
      );
    case "trees":
      return (
        <g className={s} strokeWidth="2" fill="none" strokeLinecap="round">
          <path d={`M ${cx - 12} ${cy + 12} L ${cx - 12} ${cy - 2} M ${cx - 20} ${cy + 2} L ${cx - 12} ${cy - 12} L ${cx - 4} ${cy + 2}`} />
          <path d={`M ${cx + 12} ${cy + 14} L ${cx + 12} ${cy} M ${cx + 4} ${cy + 4} L ${cx + 12} ${cy - 8} L ${cx + 20} ${cy + 4}`} />
        </g>
      );
    case "keep":
      return (
        <g className={s} strokeWidth="2" fill="none" strokeLinejoin="round">
          <path d={`M ${cx - 12} ${cy + 12} V ${cy - 6} h 5 v -6 h 4 v 6 h 6 v -6 h 4 v 6 h 5 V ${cy + 12} Z`} />
        </g>
      );
    case "camp":
      return (
        <g className={s} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M ${cx - 16} ${cy + 12} L ${cx} ${cy - 12} L ${cx + 16} ${cy + 12} Z`} />
          <path d={`M ${cx} ${cy - 12} L ${cx} ${cy + 12}`} strokeDasharray="2 3" />
        </g>
      );
    case "boulders":
      return (
        <g className={s} strokeWidth="2" fill="none" strokeLinejoin="round">
          <path d={`M ${cx - 18} ${cy + 10} l 5 -12 l 9 -2 l 4 14 Z`} />
          <path d={`M ${cx + 4} ${cy + 12} l 3 -9 l 8 -3 l 6 12 Z`} />
        </g>
      );
    case "peak":
      return (
        <g className={s} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M ${cx - 18} ${cy + 12} L ${cx - 2} ${cy - 14} L ${cx + 14} ${cy + 12}`} />
          <path d={`M ${cx - 2} ${cy - 14} L ${cx - 2} ${cy - 24} L ${cx + 8} ${cy - 20} L ${cx - 2} ${cy - 17}`} fill="#C06E52" stroke="#C06E52" strokeWidth="1.5" />
        </g>
      );
  }
}

interface FogMapProps {
  revealed: number[]; // 1-based excerpt positions with completed sessions
  current: number | null; // today's terrain (pulsing outline)
  title?: string;
  compact?: boolean;
}

export default function FogMap({ revealed, current, title = "Meditations", compact = false }: FogMapProps) {
  const isRevealed = (i: number) => revealed.includes(i + 1);
  const routePoints = ZONES.map((z) => `${z.cx},${z.cy}`).join(" ");

  return (
    <svg
      viewBox="0 0 620 440"
      role="img"
      aria-label={`Expedition map of ${title}: ${revealed.length} of ${ZONES.length} zones charted`}
      className={`w-full h-auto select-none ${compact ? "max-h-[300px]" : ""}`}
    >
      <defs>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feColorMatrix in="noise" type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.05" />
          </feComponentTransfer>
          <feComposite operator="over" in2="SourceGraphic" />
        </filter>
        <pattern id="fogHatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="#27332C" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="#1B211D" strokeWidth="2.5" />
        </pattern>
        <radialGradient id="lantern" cx="0.5" cy="0.45" r="0.75">
          <stop offset="0%" stopColor="#F0E4C4" />
          <stop offset="70%" stopColor="#E9DCC0" />
          <stop offset="100%" stopColor="#D8C69C" />
        </radialGradient>
        {ZONES.map((z, i) => (
          <clipPath key={z.id} id={`clip-${z.id}`}>
            <path d={blobPath(z.cx, z.cy, z.r, i)} />
          </clipPath>
        ))}
      </defs>

      {/* The dark desk */}
      <rect width="620" height="440" fill="#1B211D" />
      <rect x="10" y="10" width="600" height="420" fill="none" stroke="#35443B" strokeWidth="1" />

      {/* Corner ticks — surveyor's frame */}
      {[
        [10, 10], [610, 10], [10, 430], [610, 430]
      ].map(([x, y], i) => (
        <g key={i} stroke="#8AAE74" strokeWidth="1.5" opacity="0.7">
          <line x1={x} y1={y} x2={x + (x < 300 ? 14 : -14)} y2={y} />
          <line x1={x} y1={y} x2={x} y2={y + (y < 220 ? 14 : -14)} />
        </g>
      ))}

      {/* The island — lantern-lit chart */}
      <g filter="url(#grain)">
        <path
          d="M 78 396 Q 40 340 76 296 Q 52 250 96 214 Q 84 160 140 132 Q 150 76 224 76 Q 280 40 356 58 Q 430 34 486 66 Q 560 74 570 140 Q 596 196 560 244 Q 580 306 528 344 Q 520 402 448 404 Q 380 428 300 414 Q 200 432 140 414 Q 96 420 78 396 Z"
          fill="url(#lantern)"
          stroke="#CDB98F"
          strokeWidth="2"
        />
      </g>

      {/* Contour rings — depth as literal topography */}
      <g fill="none" stroke="#C4AE7F" strokeWidth="1" opacity="0.5">
        <ellipse cx="330" cy="230" rx="215" ry="150" />
        <ellipse cx="345" cy="215" rx="165" ry="112" />
        <ellipse cx="365" cy="200" rx="118" ry="78" />
        <ellipse cx="390" cy="185" rx="72" ry="48" />
      </g>

      {/* The route — dashed trail through all six zones */}
      <polyline
        points={routePoints}
        fill="none"
        stroke="#8a734a"
        strokeWidth="2"
        strokeDasharray="3 7"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Zones: terrain beneath, fog above */}
      {ZONES.map((z, i) => {
        const open = isRevealed(i);
        const isCurrent = current === i + 1;
        return (
          <g key={z.id}>
            {/* terrain */}
            <path d={blobPath(z.cx, z.cy, z.r, i)} fill={TERRAIN_FILL[i]} stroke="#B49E71" strokeWidth="1.5" />
            {open && <ZoneIcon zone={z} />}
            {open && (
              <text
                x={z.cx}
                y={z.cy + z.r * 0.62 + 14}
                textAnchor="middle"
                className="font-instrument"
                fontSize="10.5"
                letterSpacing="1.5"
                fill="#4a3f28"
              >
                {z.name.toUpperCase()}
              </text>
            )}
            {/* fog lifts with a slow dissolve when the zone is understood */}
            <g clipPath={`url(#clip-${z.id})`} style={{ transition: "opacity 1.4s ease", opacity: open ? 0 : 1 }} pointerEvents="none">
              <rect x={z.cx - z.r - 8} y={z.cy - z.r - 8} width={z.r * 2 + 16} height={z.r * 2 + 16} fill="url(#fogHatch)" opacity="0.92" />
            </g>
            {!open && (
              <path d={blobPath(z.cx, z.cy, z.r, i)} fill="none" stroke="#35443B" strokeWidth="1.5" />
            )}
            {/* today's terrain: an ember survey line */}
            {isCurrent && (
              <path
                d={blobPath(z.cx, z.cy, z.r + 7, i)}
                fill="none"
                stroke="#E8AC5B"
                strokeWidth="2"
                strokeDasharray="5 5"
                className="lantern-pulse"
              />
            )}
          </g>
        );
      })}

      {/* Compass rose */}
      <g transform="translate(560, 62)" stroke="#8AAE74" fill="none" strokeWidth="1.5" opacity="0.85">
        <circle r="16" />
        <path d="M 0 -13 L 4 0 L 0 13 L -4 0 Z" fill="#8AAE74" stroke="none" />
        <text y="-22" textAnchor="middle" fontSize="11" fill="#8AAE74" stroke="none" className="font-instrument">
          N
        </text>
      </g>

      {/* Cartouche */}
      <g transform="translate(28, 28)">
        <rect width="196" height="52" fill="#1B211D" stroke="#8AAE74" strokeWidth="1" opacity="0.92" />
        <text x="12" y="21" fontSize="12" letterSpacing="2.5" fill="#E9DCC0" className="font-instrument">
          {title.toUpperCase()}
        </text>
        <text x="12" y="40" fontSize="10" letterSpacing="1.5" fill="#9AA9A0" className="font-instrument">
          DEPTH CHART \u00b7 {revealed.length}/{ZONES.length} ZONES
        </text>
      </g>
    </svg>
  );
}
