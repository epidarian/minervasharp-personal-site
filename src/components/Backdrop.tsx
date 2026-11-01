import { DriveScene } from "../scenes/DriveScene";

// Fixed, full-viewport backdrop: a sky that drifts between twilight and a
// clear day, with the waterfront roadside panning past on a seamless loop.
export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <div className="sky sky-day" />
      <div className="sky sky-dusk" />
      <DriveScene />
      <div className="backdrop-vignette" />
    </div>
  );
}
