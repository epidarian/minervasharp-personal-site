import type { ReactNode } from "react";
import { mulberry32, range, rangeInt, chance, pick } from "../../lib/prng";
import { Glow } from "../../primitives/Glow";
import { TILE_W, FAR_BASE, WATER_Y, GROUND_Y } from "./constants";

// Distant layer: hills, the bay, a downtown cluster on the far shore, a
// low-rise waterfront, and a long girder bridge. Drawn in daylight colours;
// twilight is produced by a colour-matrix copy plus a separate lights pass.

type Kind = "slab" | "glass" | "spire" | "wedge" | "stepped" | "mid";
type ToneName = "white" | "cream" | "tan" | "glass" | "deep" | "gray";

interface Tone {
  lit: string;
  shade: string;
  line: string;
}

const TONES: Record<ToneName, Tone> = {
  white: { lit: "#eef0f2", shade: "#c6ccd5", line: "#d5dae1" },
  cream: { lit: "#ebe2cf", shade: "#c5b9a2", line: "#d8cdb7" },
  tan: { lit: "#d8c29f", shade: "#b29a76", line: "#c6af8a" },
  glass: { lit: "#7ea5d2", shade: "#5a7fab", line: "#9cbde0" },
  deep: { lit: "#5a7fae", shade: "#41618b", line: "#7396c2" },
  gray: { lit: "#c4cbd4", shade: "#9ea7b3", line: "#b3bbc6" },
};

const CAP_LIT = "#93aaa2";
const CAP_SHADE = "#6f857e";

interface Tower {
  x: number;
  w: number;
  h: number;
  kind: Kind;
  tone: ToneName;
  cap?: number;
  beacon?: boolean;
}

// Hand-placed downtown cluster on the far shore.
const CLUSTER: Tower[] = [
  { x: 300, w: 58, h: 70, kind: "mid", tone: "cream" },
  { x: 336, w: 44, h: 182, kind: "glass", tone: "glass" },
  { x: 384, w: 52, h: 150, kind: "slab", tone: "white" },
  { x: 430, w: 40, h: 110, kind: "mid", tone: "tan" },
  { x: 462, w: 50, h: 205, kind: "spire", tone: "white", cap: 34 },
  { x: 506, w: 34, h: 128, kind: "glass", tone: "deep" },
  { x: 536, w: 64, h: 96, kind: "mid", tone: "white" },
  { x: 590, w: 46, h: 172, kind: "stepped", tone: "gray" },
  { x: 632, w: 54, h: 250, kind: "spire", tone: "white", cap: 46, beacon: true },
  { x: 690, w: 60, h: 122, kind: "slab", tone: "cream" },
  { x: 744, w: 44, h: 96, kind: "mid", tone: "tan" },
  { x: 782, w: 58, h: 288, kind: "wedge", tone: "white", cap: 42, beacon: true },
  { x: 846, w: 76, h: 152, kind: "slab", tone: "white" },
  { x: 916, w: 44, h: 112, kind: "mid", tone: "cream" },
  { x: 952, w: 40, h: 204, kind: "stepped", tone: "glass" },
  { x: 996, w: 58, h: 136, kind: "slab", tone: "white" },
  { x: 1050, w: 48, h: 92, kind: "mid", tone: "tan" },
  { x: 1094, w: 36, h: 162, kind: "glass", tone: "deep" },
  { x: 1132, w: 60, h: 80, kind: "mid", tone: "white" },
  { x: 1186, w: 44, h: 60, kind: "mid", tone: "cream" },
];

// Tallest first, so shorter buildings overlap them.
const TOWERS = [...CLUSTER].sort((a, b) => b.h - a.h);

// ----- low-rise waterfront ----------------------------------------------------

interface Low {
  x: number;
  w: number;
  h: number;
  tone: ToneName;
  roof: boolean;
}

interface Palm {
  x: number;
  h: number;
}

const rng = mulberry32(2026);

function lowRow(start: number, end: number, minH: number, maxH: number, palms: Palm[]): Low[] {
  const out: Low[] = [];
  let x = start;
  let n = 0;
  for (;;) {
    const w = rangeInt(rng, 22, 52);
    if (x + w > end) break;
    out.push({
      x,
      w,
      h: rangeInt(rng, minH, maxH),
      tone: pick(rng, ["cream", "white", "tan", "white"] as const),
      roof: chance(rng, 0.45),
    });
    const gap = rangeInt(rng, 2, 7);
    if (++n % 3 === 0 && x + w + gap < end) {
      palms.push({ x: x + w + Math.floor(gap / 2), h: rangeInt(rng, 34, 52) });
    }
    x += w + gap;
  }
  return out;
}

const PALMS: Palm[] = [];
const LOWS: Low[] = [
  ...lowRow(6, 296, 10, 32, PALMS),
  ...lowRow(288, 1236, 14, 40, PALMS),
  ...lowRow(1240, 1508, 10, 28, PALMS),
];

// ----- bridge -------------------------------------------------------------------

const BR_L = 1520;
const BR_R = 2372;

function deckY(x: number): number {
  const t = Math.min(1, Math.max(0, (x - BR_L) / (BR_R - BR_L)));
  return WATER_Y - 8 - 92 * Math.sin(Math.PI * Math.pow(t, 1.4));
}

const DECK_TOP: [number, number][] = [];
for (let x = BR_L; x < BR_R; x += 8) DECK_TOP.push([x, deckY(x)]);
DECK_TOP.push([BR_R, deckY(BR_R)]);

const PIERS: number[] = [];
for (let x = BR_L + 40; x < BR_R - 24; x += 44) {
  if (WATER_Y - (deckY(x) + 9) > 12) PIERS.push(x);
}

const LAMPS: number[] = [];
for (let x = BR_L + 30; x < BR_R - 20; x += 44) LAMPS.push(x);

const DECK_POLY =
  DECK_TOP.map(([x, y]) => `${x},${y}`).join(" ") +
  " " +
  [...DECK_TOP]
    .reverse()
    .map(([x, y]) => `${x},${y + 9}`)
    .join(" ");
const DECK_LINE = DECK_TOP.map(([x, y]) => `${x},${y}`).join(" ");
const DECK_UNDER = DECK_TOP.map(([x, y]) => `${x},${y + 9}`).join(" ");

// ----- hills and water ----------------------------------------------------------

// First and last points match so the ridge tiles.
const HILL_PTS = [
  [0, 524], [140, 518], [300, 512], [460, 515], [620, 506], [820, 511],
  [1000, 502], [1180, 508], [1360, 500], [1540, 510], [1720, 518],
  [1900, 512], [2100, 519], [2260, 516], [2400, 524],
];
const HILLS = `-1,${WATER_Y} -1,${HILL_PTS[0][1]} ${HILL_PTS.map(([x, y]) => `${x},${y}`).join(" ")} ${TILE_W + 1},${HILL_PTS[0][1]} ${TILE_W + 1},${WATER_Y}`;

const STREAKS = Array.from({ length: 36 }, () => ({
  x: range(rng, 0, TILE_W - 160),
  y: range(rng, WATER_Y + 3, WATER_Y + 34),
  w: range(rng, 30, 160),
}));

// ----- lights (precomputed so both tiles match) ---------------------------------

const WARM = ["#ffd98f", "#fff0c4", "#ffc36b", "#e9f0ff"] as const;

interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
  c: string;
  o: number;
}

const CELLS: Cell[] = [];
const REFLECTIONS: Cell[] = [];
const BEACONS: [number, number][] = [];

for (const t of CLUSTER) {
  const top = FAR_BASE - t.h;
  const wl = Math.round(t.w * 0.68);
  const xm = t.x + wl;
  const startY = top + (t.kind === "wedge" ? (t.cap ?? 0) : 0) + 6;
  const stepY = top + Math.round(t.h * 0.3);
  for (let y = startY; y < FAR_BASE - 10; y += 8) {
    let xa = t.x;
    let xb = t.x + t.w;
    if (t.kind === "stepped" && y < stepY) {
      xa = t.x + Math.round(t.w * 0.18);
      xb = xa + Math.round(t.w * 0.64);
    }
    for (let x = xa + 3; x < xb - 4; x += 6) {
      if (!chance(rng, t.kind === "mid" ? 0.36 : 0.3)) continue;
      CELLS.push({
        x,
        y,
        w: 3,
        h: 4,
        c: pick(rng, WARM),
        o: (x >= xm ? 0.55 : 0.92) * range(rng, 0.6, 1),
      });
    }
  }
  for (let k = 0; k < 2; k++) {
    REFLECTIONS.push({
      x: range(rng, t.x + 4, t.x + t.w - 4),
      y: WATER_Y + 2,
      w: 2.4,
      h: range(rng, 12, 30),
      c: pick(rng, WARM),
      o: 0.32,
    });
  }
  if (t.beacon) {
    if (t.kind === "spire") BEACONS.push([xm, top - (t.cap ?? 0) - 12]);
    else BEACONS.push([t.x + t.w - 3, top - 2]);
  }
}

for (const b of LOWS) {
  const n = rangeInt(rng, 0, 3);
  for (let k = 0; k < n; k++) {
    CELLS.push({
      x: range(rng, b.x + 3, b.x + b.w - 6),
      y: range(rng, FAR_BASE - b.h + 5, FAR_BASE - 6),
      w: 3,
      h: 3,
      c: pick(rng, WARM),
      o: range(rng, 0.6, 1),
    });
  }
}

const SHORE_LIGHTS: [number, number, string][] = [];
for (let x = 4; x < BR_L; x += rangeInt(rng, 6, 14)) {
  if (chance(rng, 0.55)) SHORE_LIGHTS.push([x, FAR_BASE - 1, pick(rng, WARM)]);
}

// ----- shapes ---------------------------------------------------------------------

function faces(key: string, xl: number, xm: number, xr: number, yt: number, yb: number, tone: Tone) {
  return [
    <rect key={`${key}l`} x={xl} y={yt} width={xm - xl} height={yb - yt} fill={tone.lit} />,
    <rect key={`${key}s`} x={xm} y={yt} width={xr - xm} height={yb - yt} fill={tone.shade} />,
  ];
}

function hLines(key: string, xl: number, xm: number, xr: number, yt: number, yb: number, tone: Tone) {
  const out: ReactNode[] = [];
  for (let y = yt + 5; y < yb - 3; y += 6) {
    out.push(<rect key={`${key}h${y}l`} x={xl} y={y} width={xm - xl} height={1.2} fill={tone.line} />);
    out.push(<rect key={`${key}h${y}s`} x={xm} y={y} width={xr - xm} height={1.2} fill="#000" opacity={0.07} />);
  }
  return out;
}

function vLines(key: string, xl: number, xm: number, xr: number, yt: number, yb: number, tone: Tone) {
  const out: ReactNode[] = [];
  for (let x = xl + 4; x < xr - 2; x += 6) {
    const lit = x < xm;
    out.push(
      <rect
        key={`${key}v${x}`}
        x={x}
        y={yt + 3}
        width={1.2}
        height={yb - yt - 3}
        fill={lit ? tone.line : "#000"}
        opacity={lit ? 1 : 0.08}
      />,
    );
  }
  return out;
}

function TowerShape({ t }: { t: Tower }) {
  const tone = TONES[t.tone];
  const base = FAR_BASE;
  const top = base - t.h;
  const wl = Math.round(t.w * 0.68);
  const xm = t.x + wl;
  const xr = t.x + t.w;
  const els: ReactNode[] = [];

  if (t.kind === "wedge") {
    const s = t.cap ?? 30;
    const ym = top + s * (1 - wl / t.w);
    els.push(<polygon key="l" points={`${t.x},${base} ${t.x},${top + s} ${xm},${ym} ${xm},${base}`} fill={tone.lit} />);
    els.push(<polygon key="s" points={`${xm},${base} ${xm},${ym} ${xr},${top} ${xr},${base}`} fill={tone.shade} />);
    for (let x = t.x + 5; x < xr - 3; x += 7) {
      const yt = top + s * (1 - (x - t.x) / t.w) + 4;
      const lit = x < xm;
      els.push(
        <rect key={`v${x}`} x={x} y={yt} width={1.4} height={base - yt} fill={lit ? tone.line : "#000"} opacity={lit ? 1 : 0.08} />,
      );
    }
  } else if (t.kind === "stepped") {
    const stepY = top + Math.round(t.h * 0.3);
    const ux = t.x + Math.round(t.w * 0.18);
    const uw = Math.round(t.w * 0.64);
    const uxm = ux + Math.round(uw * 0.68);
    els.push(...faces("u", ux, uxm, ux + uw, top, stepY, tone));
    els.push(...vLines("u", ux, uxm, ux + uw, top, stepY, tone));
    els.push(...faces("b", t.x, xm, xr, stepY, base, tone));
    els.push(...vLines("b", t.x, xm, xr, stepY, base, tone));
  } else {
    if (t.kind === "glass") {
      els.push(
        <polygon
          key="l"
          points={`${t.x},${base} ${t.x},${top + 8} ${t.x + 8},${top} ${xm},${top} ${xm},${base}`}
          fill={tone.lit}
        />,
      );
      els.push(<rect key="s" x={xm} y={top} width={xr - xm} height={t.h} fill={tone.shade} />);
      els.push(...vLines("g", t.x, xm, xr, top + 6, base, tone));
    } else {
      els.push(...faces("f", t.x, xm, xr, top, base, tone));
      if (t.kind === "mid") {
        for (let y = top + 5; y < base - 4; y += 7) {
          for (let x = t.x + 3; x < xr - 4; x += 6) {
            els.push(<rect key={`w${x}-${y}`} x={x} y={y} width={3} height={3} fill="#000" opacity={0.13} />);
          }
        }
      } else {
        els.push(...hLines("f", t.x, xm, xr, top, base, tone));
      }
    }
    if (t.kind === "spire") {
      const c = t.cap ?? 30;
      els.push(<polygon key="cl" points={`${t.x},${top} ${xm},${top} ${xm},${top - c}`} fill={CAP_LIT} />);
      els.push(<polygon key="cs" points={`${xm},${top - c} ${xm},${top} ${xr},${top}`} fill={CAP_SHADE} />);
      els.push(<rect key="mast" x={xm - 0.6} y={top - c - 12} width={1.2} height={12} fill="#6d7480" />);
    } else if (t.kind === "slab" || t.kind === "mid") {
      els.push(
        <rect key="mech" x={t.x + t.w * 0.3} y={top - 6} width={t.w * 0.35} height={6} fill={tone.shade} />,
      );
    }
  }
  return <g>{els}</g>;
}

function LowShape({ b }: { b: Low }) {
  const tone = TONES[b.tone];
  const top = FAR_BASE - b.h;
  const xm = b.x + Math.round(b.w * 0.75);
  return (
    <g>
      <rect x={b.x} y={top} width={xm - b.x} height={b.h} fill={tone.lit} />
      <rect x={xm} y={top} width={b.x + b.w - xm} height={b.h} fill={tone.shade} />
      {b.roof && (
        <polygon
          points={`${b.x - 2},${top} ${b.x + 4},${top - 7} ${b.x + b.w - 4},${top - 7} ${b.x + b.w + 2},${top}`}
          fill="#b8653f"
        />
      )}
      {b.h > 18 && (
        <rect x={b.x + 3} y={top + 6} width={b.w - 6} height={2} fill="#000" opacity={0.12} />
      )}
    </g>
  );
}

const FROND_ANGLES = [-170, -140, -110, -70, -40, -10];

function FarPalm({ p }: { p: Palm }) {
  const top = FAR_BASE - p.h;
  const cx = p.x + 2;
  return (
    <g>
      <line x1={p.x} y1={FAR_BASE} x2={cx} y2={top} stroke="#7e6d58" strokeWidth={1.6} />
      {FROND_ANGLES.map((a) => {
        const r = (a * Math.PI) / 180;
        const tx = cx + Math.cos(r) * 11;
        const ty = top + Math.sin(r) * 11 + 4;
        const qx = cx + Math.cos(r) * 7;
        const qy = top + Math.sin(r) * 7 - 2;
        return (
          <path key={a} d={`M ${cx} ${top} Q ${qx} ${qy} ${tx} ${ty}`} stroke="#4d6b4a" strokeWidth={2} fill="none" />
        );
      })}
    </g>
  );
}

function Bridge() {
  return (
    <g>
      {PIERS.map((px) => {
        const pt = deckY(px) + 9;
        return (
          <g key={px}>
            <rect x={px - 9} y={WATER_Y + 3} width={18} height={Math.min(30, (WATER_Y - pt) * 0.6)} fill="#8f8c84" opacity={0.22} />
            <polygon points={`${px - 10},${pt} ${px - 2},${pt} ${px - 4},${WATER_Y + 2} ${px - 8},${WATER_Y + 2}`} fill="#c2bfb7" />
            <polygon points={`${px + 2},${pt} ${px + 10},${pt} ${px + 8},${WATER_Y + 2} ${px + 4},${WATER_Y + 2}`} fill="#9d9a92" />
            <rect x={px - 11} y={pt} width={22} height={4} fill="#b3b0a8" />
            <rect x={px - 11} y={WATER_Y - 1} width={22} height={4} fill="#8f8c84" />
          </g>
        );
      })}
      <polygon points={DECK_POLY} fill="#c6c3bb" />
      <polyline points={DECK_LINE} fill="none" stroke="#e6e4de" strokeWidth={2.5} />
      <polyline points={DECK_UNDER} fill="none" stroke="#8c8a84" strokeWidth={2} />
      {LAMPS.map((lx) => {
        const y = deckY(lx);
        return (
          <path key={lx} d={`M ${lx} ${y} L ${lx} ${y - 13} L ${lx + 4} ${y - 13}`} stroke="#7d7b75" strokeWidth={1} fill="none" />
        );
      })}
    </g>
  );
}

export function FarBase() {
  return (
    <g>
      <polygon points={HILLS} fill="#a9b8cc" />
      <rect x={-1} y={WATER_Y} width={TILE_W + 2} height={GROUND_Y - WATER_Y} fill="#4c88ba" />
      <rect x={-1} y={WATER_Y + 22} width={TILE_W + 2} height={GROUND_Y - WATER_Y - 22} fill="#3f78a8" opacity={0.6} />
      {STREAKS.map((s, i) => (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={1.2} fill="#a8d0ee" opacity={0.5} />
      ))}
      {/* far shore, broken where the bridge crosses open water */}
      <rect x={-1} y={FAR_BASE - 6} width={BR_L + 11} height={WATER_Y - FAR_BASE + 6} fill="#a8a28f" />
      <rect x={BR_R - 10} y={FAR_BASE - 6} width={TILE_W - BR_R + 11} height={WATER_Y - FAR_BASE + 6} fill="#a8a28f" />
      <Bridge />
      {TOWERS.map((t) => (
        <TowerShape key={t.x} t={t} />
      ))}
      {LOWS.map((b) => (
        <LowShape key={b.x} b={b} />
      ))}
      {PALMS.map((p) => (
        <FarPalm key={p.x} p={p} />
      ))}
    </g>
  );
}

export function FarLights() {
  return (
    <g>
      {CELLS.map((c, i) => (
        <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} fill={c.c} opacity={c.o} />
      ))}
      {REFLECTIONS.map((c, i) => (
        <rect key={`r${i}`} x={c.x} y={c.y} width={c.w} height={c.h} fill={c.c} opacity={c.o} />
      ))}
      {SHORE_LIGHTS.map(([x, y, c], i) => (
        <circle key={`s${i}`} cx={x} cy={y} r={1.2} fill={c} />
      ))}
      {BEACONS.map(([x, y], i) => (
        <g key={`b${i}`}>
          <Glow cx={x} cy={y} r={10} color="#ff4a4a" opacity={0.7} />
          <circle cx={x} cy={y} r={1.8} fill="#ff6a5a" />
        </g>
      ))}
      {LAMPS.map((lx) => {
        const y = deckY(lx) - 13;
        return (
          <g key={`l${lx}`}>
            <Glow cx={lx + 4} cy={y} r={9} color="#ffe2a8" opacity={0.7} />
            <circle cx={lx + 4} cy={y} r={1.7} fill="#ffe7b5" />
            <rect x={lx + 3} y={WATER_Y + 2} width={2} height={26} fill="#ffd590" opacity={0.5} />
          </g>
        );
      })}
    </g>
  );
}
