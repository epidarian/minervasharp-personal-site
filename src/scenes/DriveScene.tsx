import type { ReactNode } from "react";
import { TILE_W, VIEW_H } from "./drive/constants";
import { FarBase, FarLights } from "./drive/far";
import { NearBase, NearLights } from "./drive/near";

// Twilight grade applied to a copy of each layer. Rows are R, G, B, A.
const NEAR_DUSK = `
  0.32 0.06 0.04 0 0.02
  0.05 0.30 0.08 0 0.03
  0.08 0.12 0.52 0 0.09
  0    0    0    1 0`;
const FAR_DUSK = `
  0.30 0.08 0.06 0 0.10
  0.06 0.30 0.10 0 0.10
  0.08 0.12 0.45 0 0.22
  0    0    0    1 0`;

function Tiles({ children }: { children: ReactNode }) {
  return (
    <>
      <g>{children}</g>
      <g transform={`translate(${TILE_W} 0)`}>{children}</g>
    </>
  );
}

function TileSvg({ className, children }: { className: string; children: ReactNode }) {
  return (
    <svg
      className={`tile ${className}`}
      viewBox={`0 0 ${TILE_W * 2} ${VIEW_H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// One parallax layer: two tiles end to end inside a track that slides by one
// tile per loop. Day, dusk-graded, and lights copies share the same track so
// they cannot drift apart; only their opacities follow the day cycle.
function Layer({ name, base, lights, dusk }: { name: string; base: ReactNode; lights: ReactNode; dusk: string }) {
  const filterId = `dusk-${name}`;
  return (
    <div className={`layer layer-${name}`}>
      <div className="track">
        <TileSvg className="tile-day">
          <Tiles>{base}</Tiles>
        </TileSvg>
        <TileSvg className="tile-dusk">
          <defs>
            <filter id={filterId} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={dusk} />
            </filter>
          </defs>
          <g filter={`url(#${filterId})`}>
            <Tiles>{base}</Tiles>
          </g>
        </TileSvg>
        <TileSvg className="tile-lights">
          <Tiles>{lights}</Tiles>
        </TileSvg>
      </div>
    </div>
  );
}

export function DriveScene() {
  return (
    <>
      <Layer name="far" base={<FarBase />} lights={<FarLights />} dusk={FAR_DUSK} />
      <Layer name="near" base={<NearBase />} lights={<NearLights />} dusk={NEAR_DUSK} />
    </>
  );
}
