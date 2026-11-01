import { useSvgId } from "../../primitives/ids";
import { Glow } from "../../primitives/Glow";
import { TILE_W, VIEW_H, SEAWALL_Y, GROUND_Y } from "./constants";

// Near layer: the waterfront roadside the viewer drives along. Station on
// the left half of the tile, an open stretch with a jersey barrier on the
// right half. Utility poles sit at the kerb in front of everything else.

// ----- layout -------------------------------------------------------------------

const POLES = [0, 1200, 1800]; // spans 1200, 600, 600 -> next tile's pole at 2400
const POLE_TOP = 170;
const ARM1 = 184;
const ARM2 = 206;
const COMM = 286;
const LAMP_POLES = [1200, 1800];

const CAN_L = 330;
const CAN_R = 900;
const FASCIA_T = 393;
const FASCIA_B = 423;
const UNDER_B = 427;
const DEPTH_X = 18;
const DEPTH_Y = 14;

const STORE_L = 820;
const STORE_R = 1110;
const STORE_M = 1060;
const STORE_T = 433;
const STORE_B = 588;

const LOT_L = 120;
const LOT_R = 1120;

const SIGN_X = 190;
const SIGN_L = 128;
const SIGN_R = 256;
const SIGN_T = 356;
const SIGN_B = 436;

const PUMPS = [520, 690];
const ISLAND_L = 470;
const ISLAND_R = 760;

const CAR_X = 600;
const CAR_G = 618;

const BARRIER_L = 1160;
const BARRIER_R = 2360;

const PALMS = [1320, 1690, 2130];
const PALM_TOP = 384;

// ----- wires: sag grows with the square of the span, like a real catenary --------

function wirePath(y: number, k: number): string {
  const xs = [...POLES, TILE_W];
  let d = `M ${xs[0]} ${y}`;
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i];
    const b = xs[i + 1];
    const drop = k * (b - a) * (b - a);
    d += ` Q ${(a + b) / 2} ${y + drop * 2} ${b} ${y}`;
  }
  return d;
}

const K_POWER = 13 / (600 * 600);
const K_COMM = K_POWER * 1.3;

// ----- pieces -------------------------------------------------------------------

function Seawall() {
  const joints = [];
  for (let x = 30; x < TILE_W; x += 60) {
    joints.push(<rect key={x} x={x} y={SEAWALL_Y + 3} width={1.5} height={GROUND_Y - SEAWALL_Y - 3} fill="#77736a" />);
  }
  return (
    <g>
      <rect x={-1} y={SEAWALL_Y} width={TILE_W + 2} height={GROUND_Y - SEAWALL_Y} fill="#8f8a80" />
      <rect x={-1} y={SEAWALL_Y - 2} width={TILE_W + 2} height={5} fill="#cfc9bb" />
      {joints}
    </g>
  );
}

function Palm({ x }: { x: number }) {
  const lean = 6;
  const cx = x + lean;
  const top = PALM_TOP;
  const angles = [-175, -150, -122, -95, -68, -40, -12, 168, 12];
  return (
    <g>
      <polygon points={`${x - 5},${SEAWALL_Y} ${x + 5},${SEAWALL_Y} ${cx + 3},${top} ${cx - 3},${top}`} fill="#8a7660" />
      {[0.2, 0.4, 0.6, 0.8].map((f) => (
        <rect
          key={f}
          x={x - 4 + lean * (1 - f)}
          y={top + (SEAWALL_Y - top) * f}
          width={8}
          height={1.5}
          fill="#6d5c48"
        />
      ))}
      <polygon points={`${cx - 7},${top + 2} ${cx + 7},${top + 2} ${cx + 4},${top + 16} ${cx - 4},${top + 16}`} fill="#8a7556" />
      {angles.map((a, i) => {
        const r = (a * Math.PI) / 180;
        const len = 56;
        const tx = cx + Math.cos(r) * len;
        const ty = top + Math.sin(r) * len + len * 0.3;
        const mx = cx + Math.cos(r) * len * 0.45;
        const my = top + Math.sin(r) * len * 0.45;
        const nx = -Math.sin(r) * 5;
        const ny = Math.cos(r) * 5;
        return (
          <polygon
            key={a}
            points={`${cx},${top} ${mx + nx},${my + ny} ${tx},${ty} ${mx - nx},${my - ny}`}
            fill={i % 2 ? "#3f6a3c" : "#4f7d47"}
          />
        );
      })}
    </g>
  );
}

function Pump({ x }: { x: number }) {
  const w = 30;
  const h = 60;
  const base = 588;
  const top = base - h;
  return (
    <g>
      <rect x={x - 3} y={top - 14} width={w + 12} height={12} fill="#d6333d" />
      <rect x={x - 3} y={top - 9} width={w + 12} height={2} fill="#f4f1ea" />
      <rect x={x} y={top} width={w} height={h} fill="#eceef1" />
      <rect x={x + w} y={top} width={6} height={h} fill="#b7bcc5" />
      <rect x={x + 6} y={top + 10} width={w - 12} height={13} fill="#27313d" />
      <path d={`M ${x + w + 3} ${top + 30} Q ${x + w + 14} ${top + 44} ${x + w + 4} ${base - 4}`} stroke="#1f2228" strokeWidth={2} fill="none" />
    </g>
  );
}

function Car() {
  const g = CAR_G;
  const L = CAR_X - 80;
  const R = CAR_X + 80;
  return (
    <g>
      <polygon
        points={`${L},${g - 8} ${L + 3},${g - 28} ${L + 40},${g - 33} ${L + 62},${g - 54} ${L + 112},${g - 54} ${L + 136},${g - 33} ${R - 2},${g - 30} ${R},${g - 8}`}
        fill="#b0302c"
      />
      <rect x={L} y={g - 16} width={R - L} height={8} fill="#7f2220" />
      <polygon
        points={`${L + 46},${g - 34} ${L + 64},${g - 50} ${L + 108},${g - 50} ${L + 128},${g - 34}`}
        fill="#2b3644"
      />
      <rect x={L + 85} y={g - 50} width={4} height={16} fill="#b0302c" />
      <rect x={L + 1} y={g - 26} width={8} height={4} fill="#f2f0e6" />
      <rect x={R - 6} y={g - 27} width={5} height={5} fill="#e04040" />
      {[L + 32, R - 32].map((wx) => (
        <g key={wx}>
          <circle cx={wx} cy={g - 10} r={10} fill="#1b1b20" />
          <circle cx={wx} cy={g - 10} r={4} fill="#8a8f98" />
        </g>
      ))}
    </g>
  );
}

function Station() {
  const mullions = [1, 2, 3].map((k) => 836 + k * 51);
  return (
    <g>
      {/* lot surface between the road and the water */}
      <polygon points={`${LOT_L - 20},${GROUND_Y} ${LOT_L},${SEAWALL_Y} ${LOT_R},${SEAWALL_Y} ${LOT_R + 20},${GROUND_Y}`} fill="#b7b2a8" />

      {/* store, set back behind the canopy */}
      <rect x={STORE_L} y={STORE_T} width={STORE_M - STORE_L} height={STORE_B - STORE_T} fill="#e8dfcf" />
      <rect x={STORE_M} y={STORE_T} width={STORE_R - STORE_M} height={STORE_B - STORE_T} fill="#c4b9a6" />
      <rect x={STORE_L - 4} y={STORE_T - 5} width={STORE_R - STORE_L + 8} height={12} fill="#b65c3b" />
      <rect x={STORE_M} y={STORE_T - 5} width={STORE_R - STORE_M + 4} height={12} fill="#000" opacity={0.18} />
      <rect x={840} y={STORE_T + 13} width={200} height={16} fill="#2c3546" />
      {[0, 1, 2, 3, 4].map((k) => (
        <rect key={k} x={852 + k * 36} y={STORE_T + 17} width={26} height={8} fill="#f0ece2" />
      ))}
      <rect x={836} y={STORE_T + 37} width={204} height={STORE_B - STORE_T - 41} fill="#4d6784" />
      <polygon points={`860,${STORE_T + 37} 900,${STORE_T + 37} 850,${STORE_B - 4} 836,${STORE_B - 4}`} fill="#7f9cba" opacity={0.5} />
      {mullions.map((x) => (
        <rect key={x} x={x} y={STORE_T + 37} width={3} height={STORE_B - STORE_T - 41} fill="#d8d1c3" />
      ))}
      <rect x={836} y={STORE_B - 8} width={204} height={4} fill="#d8d1c3" />

      {/* canopy: back columns, underside, fascia, front columns */}
      {[372, 846].map((x) => (
        <rect key={`b${x}`} x={x + DEPTH_X} y={UNDER_B + DEPTH_Y} width={16} height={GROUND_Y - DEPTH_Y - UNDER_B - DEPTH_Y} fill="#c3c7ce" />
      ))}
      <polygon
        points={`${CAN_L},${UNDER_B} ${CAN_R},${UNDER_B} ${CAN_R + DEPTH_X},${UNDER_B + DEPTH_Y} ${CAN_L + DEPTH_X},${UNDER_B + DEPTH_Y}`}
        fill="#d9d6ce"
      />
      <polygon
        points={`${CAN_R},${FASCIA_T} ${CAN_R + DEPTH_X},${FASCIA_T + DEPTH_Y} ${CAN_R + DEPTH_X},${UNDER_B + DEPTH_Y} ${CAN_R},${UNDER_B}`}
        fill="#a92530"
      />
      <rect x={CAN_L} y={FASCIA_T - 2} width={CAN_R - CAN_L} height={2} fill="#f0eee8" />
      <rect x={CAN_L} y={FASCIA_T} width={CAN_R - CAN_L} height={FASCIA_B - FASCIA_T} fill="#d6333d" />
      <rect x={CAN_L} y={FASCIA_B - 9} width={CAN_R - CAN_L} height={4} fill="#f4f1ea" />
      <rect x={CAN_L} y={FASCIA_B} width={CAN_R - CAN_L} height={UNDER_B - FASCIA_B} fill="#a92530" />

      {/* pump island and pumps */}
      <rect x={ISLAND_L} y={582} width={ISLAND_R - ISLAND_L} height={6} fill="#cfcac0" />
      <rect x={ISLAND_L} y={588} width={ISLAND_R - ISLAND_L} height={6} fill="#aaa59b" />
      {PUMPS.map((x) => (
        <Pump key={x} x={x} />
      ))}

      {[372, 846].map((x) => (
        <g key={`f${x}`}>
          <rect x={x} y={UNDER_B} width={8} height={GROUND_Y - UNDER_B} fill="#dfe2e7" />
          <rect x={x + 8} y={UNDER_B} width={8} height={GROUND_Y - UNDER_B} fill="#b3b8c1" />
        </g>
      ))}

      {/* price sign: low pylon, clear of the line and the poles */}
      <rect x={SIGN_X - 5} y={SIGN_B} width={10} height={GROUND_Y - SIGN_B} fill="#8a909a" />
      <rect x={SIGN_X - 21} y={588} width={42} height={12} fill="#a8a397" />
      <rect x={SIGN_L} y={SIGN_T} width={SIGN_R - SIGN_L} height={24} fill="#d6333d" />
      <rect x={SIGN_L + 22} y={SIGN_T + 6} width={SIGN_R - SIGN_L - 44} height={12} fill="#f4f1ea" />
      <rect x={SIGN_L} y={SIGN_T + 24} width={SIGN_R - SIGN_L} height={SIGN_B - SIGN_T - 24} fill="#1d2026" />
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <rect x={SIGN_L + 8} y={SIGN_T + 32 + k * 16} width={40} height={9} fill="#e9e5da" opacity={0.8} />
          <rect x={SIGN_L + 68} y={SIGN_T + 32 + k * 16} width={52} height={9} fill="#ffc94d" />
        </g>
      ))}
    </g>
  );
}

function UtilityPole({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 4} y={POLE_TOP} width={4} height={GROUND_Y + 4 - POLE_TOP} fill="#7b6754" />
      <rect x={x} y={POLE_TOP} width={4} height={GROUND_Y + 4 - POLE_TOP} fill="#5e4e40" />
      <rect x={x - 26} y={ARM1} width={52} height={5} fill="#6e5c4a" />
      <rect x={x - 22} y={ARM2} width={44} height={5} fill="#6e5c4a" />
      {[-20, 0, 20].map((dx) => (
        <rect key={`a${dx}`} x={x + dx - 1.5} y={ARM1 - 6} width={3} height={6} fill="#d8dde2" />
      ))}
      {[-16, 16].map((dx) => (
        <rect key={`b${dx}`} x={x + dx - 1.5} y={ARM2 - 6} width={3} height={6} fill="#d8dde2" />
      ))}
      <rect x={x - 6} y={COMM - 3} width={12} height={4} fill="#3a3530" />
    </g>
  );
}

function Transformer({ x }: { x: number }) {
  return (
    <g>
      <rect x={x - 8} y={244} width={4} height={6} fill="#5e4e40" />
      <rect x={x - 28} y={228} width={22} height={5} fill="#838a91" />
      <rect x={x - 26} y={233} width={18} height={36} fill="#9aa1a8" />
      <rect x={x - 18} y={ARM2} width={1.2} height={228 - ARM2} fill="#6b7178" />
    </g>
  );
}

function PoleLamp({ x }: { x: number }) {
  return (
    <g>
      <path d={`M ${x + 4} 302 Q ${x + 40} 286 ${x + 72} 290`} stroke="#6a6f78" strokeWidth={3} fill="none" />
      <polygon points={`${x + 60},${287} ${x + 86},${288} ${x + 84},${295} ${x + 62},${294}`} fill="#7d838c" />
    </g>
  );
}

function PowerLine() {
  return (
    <g>
      {POLES.map((x) => (
        <UtilityPole key={x} x={x} />
      ))}
      <Transformer x={1200} />
      {LAMP_POLES.map((x) => (
        <PoleLamp key={x} x={x} />
      ))}
      <g fill="none" stroke="#2b2b30">
        <path d={wirePath(ARM1 - 6, K_POWER)} strokeWidth={1.6} />
        <path d={wirePath(ARM2 - 6, K_POWER)} strokeWidth={1.6} />
        <path d={wirePath(COMM - 2, K_COMM)} strokeWidth={2.4} />
      </g>
    </g>
  );
}

function Barrier() {
  const segs = [];
  for (let x = BARRIER_L; x < BARRIER_R; x += 80) {
    const i = (x - BARRIER_L) / 80;
    segs.push(
      <g key={x}>
        <rect x={x} y={570} width={80} height={30} fill="#c9c5bc" />
        <rect x={x} y={570} width={80} height={3} fill="#e2ded5" />
        <rect x={x} y={588} width={80} height={12} fill="#d6d2c9" />
        <rect x={x} y={588} width={80} height={1} fill="#a9a59c" />
        <rect x={x + 78} y={570} width={2} height={30} fill="#6a665f" />
        {i % 2 === 0 && <rect x={x + 38} y={576} width={4} height={4} fill="#e8c35a" />}
      </g>,
    );
  }
  return (
    <g>
      <polygon points={`${BARRIER_L - 30},${GROUND_Y} ${BARRIER_L},${572} ${BARRIER_L},${GROUND_Y}`} fill="#c9c5bc" />
      <polygon points={`${BARRIER_R},${572} ${BARRIER_R + 30},${GROUND_Y} ${BARRIER_R},${GROUND_Y}`} fill="#c9c5bc" />
      {segs}
    </g>
  );
}

function Road() {
  const dashes = [];
  for (let k = 0; k < TILE_W / 200; k++) {
    dashes.push(<rect key={k} x={k * 200 + 40} y={742} width={100} height={6} fill="#e9d98f" />);
  }
  return (
    <g>
      {/* full-width shapes overlap the neighbouring tile by 1 unit to hide the seam */}
      <rect x={-1} y={GROUND_Y} width={TILE_W + 2} height={VIEW_H - GROUND_Y} fill="#55565e" />
      <rect x={-1} y={GROUND_Y} width={TILE_W + 2} height={5} fill="#bdb9b0" />
      {/* edge line, broken across the station driveway */}
      <rect x={-1} y={650} width={LOT_L - 19} height={4} fill="#eeeeea" />
      <rect x={LOT_R + 20} y={650} width={TILE_W - LOT_R - 19} height={4} fill="#eeeeea" />
      {dashes}
      {/* driveway apron */}
      <polygon points={`${LOT_L},${GROUND_Y} ${LOT_R},${GROUND_Y} ${LOT_R + 20},${640} ${LOT_L - 20},${640}`} fill="#a7a39a" />
    </g>
  );
}

export function NearBase() {
  return (
    <g>
      <Seawall />
      {PALMS.map((x) => (
        <Palm key={x} x={x} />
      ))}
      <Station />
      <PowerLine />
      <Barrier />
      <Road />
      <Car />
    </g>
  );
}

// ----- lights -----------------------------------------------------------------------

function Pool({ cx, cy, rx, ry, color, opacity }: { cx: number; cy: number; rx: number; ry: number; color: string; opacity: number }) {
  const id = useSvgId("pool");
  return (
    <g>
      <radialGradient id={id} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={color} stopOpacity={opacity} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id})`} />
    </g>
  );
}

export function NearLights() {
  const cx = (CAN_L + CAN_R) / 2;
  return (
    <g>
      {/* canopy */}
      <polygon
        points={`${CAN_L},${UNDER_B} ${CAN_R},${UNDER_B} ${CAN_R + DEPTH_X},${UNDER_B + DEPTH_Y} ${CAN_L + DEPTH_X},${UNDER_B + DEPTH_Y}`}
        fill="#fff1cf"
        opacity={0.95}
      />
      {Array.from({ length: 9 }, (_, k) => (
        <rect key={k} x={CAN_L + 30 + k * 60} y={UNDER_B + 4} width={26} height={3} fill="#ffffff" />
      ))}
      <Glow cx={cx} cy={500} r={190} color="#ffe2ad" opacity={0.4} />
      <Pool cx={cx} cy={612} rx={340} ry={28} color="#ffe0a8" opacity={0.4} />
      <rect x={CAN_L} y={FASCIA_T} width={CAN_R - CAN_L} height={FASCIA_B - FASCIA_T} fill="#ff4c5a" opacity={0.35} />

      {/* storefront */}
      <rect x={836} y={STORE_T + 37} width={204} height={STORE_B - STORE_T - 41} fill="#ffe2a8" opacity={0.92} />
      {[1, 2, 3].map((k) => (
        <rect key={k} x={836 + k * 51} y={STORE_T + 37} width={3} height={STORE_B - STORE_T - 41} fill="#3a3140" opacity={0.7} />
      ))}
      <Glow cx={938} cy={520} r={170} color="#ffd89a" opacity={0.5} />
      <Pool cx={938} cy={596} rx={170} ry={14} color="#ffd89a" opacity={0.4} />
      {[0, 1, 2, 3, 4].map((k) => (
        <rect key={`t${k}`} x={852 + k * 36} y={STORE_T + 17} width={26} height={8} fill="#fff6dc" />
      ))}

      {/* pump screens */}
      {PUMPS.map((x) => (
        <g key={x}>
          <rect x={x + 6} y={538} width={18} height={13} fill="#86e6ff" />
          <Glow cx={x + 15} cy={544} r={18} color="#86e6ff" opacity={0.5} />
        </g>
      ))}

      {/* price sign */}
      <rect x={SIGN_L} y={SIGN_T} width={SIGN_R - SIGN_L} height={24} fill="#ff4c58" opacity={0.5} />
      <rect x={SIGN_L + 22} y={SIGN_T + 6} width={SIGN_R - SIGN_L - 44} height={12} fill="#ffffff" />
      {[0, 1, 2].map((k) => (
        <rect key={k} x={SIGN_L + 68} y={SIGN_T + 32 + k * 16} width={52} height={9} fill="#ffd060" />
      ))}
      <Glow cx={SIGN_X} cy={SIGN_T + 40} r={110} color="#ffb347" opacity={0.35} />

      {/* streetlights on the poles */}
      {LAMP_POLES.map((x) => (
        <g key={`l${x}`}>
          <Glow cx={x + 73} cy={296} r={70} color="#ffd9a0" opacity={0.6} />
          <circle cx={x + 73} cy={295} r={3.5} fill="#ffe9c2" />
          <Pool cx={x + 73} cy={640} rx={160} ry={24} color="#ffd9a0" opacity={0.4} />
        </g>
      ))}

      {/* barrier reflectors */}
      {Array.from({ length: (BARRIER_R - BARRIER_L) / 160 }, (_, i) => {
        const x = BARRIER_L + i * 160 + 40;
        return <circle key={`r${i}`} cx={x} cy={578} r={2.2} fill="#ffd36b" />;
      })}
    </g>
  );
}
