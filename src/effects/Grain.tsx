// Fixed film-grain overlay. A single static turbulence texture at low opacity,
// screen/overlay blended over the whole viewport. No animation (cheap, and
// honors reduced motion by simply being static).
export function Grain() {
  return (
    <svg
      className="grain"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="none"
    >
      <filter id="grain-noise">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-noise)" />
    </svg>
  );
}
