import { useSvgId } from "./ids";

export interface GlowProps {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity?: number;
}

// Soft bloom: a radial gradient disc, screen-blended via the parent group.
export function Glow({ cx, cy, r, color, opacity = 0.85 }: GlowProps) {
  const id = useSvgId("glow");
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <radialGradient id={id} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={color} stopOpacity={opacity} />
        <stop offset="35%" stopColor={color} stopOpacity={opacity * 0.6} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </radialGradient>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
    </g>
  );
}
