import { useState } from "react";
import type { Track } from "../content/resume";
import { roles, trackLabels } from "../content/resume";
import { ExperienceCard } from "./ExperienceCard";

const ALL: Track[] = ["software", "platform", "security"];

export function Experience() {
  const [active, setActive] = useState<Set<Track>>(new Set(ALL));

  function toggle(t: Track) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      // never allow an empty filter: re-enable all when the last is removed
      if (next.size === 0) return new Set(ALL);
      return next;
    });
  }

  return (
    <div className="xp">
      <div className="xp-filters" role="group" aria-label="Filter by track">
        {ALL.map((t) => {
          const on = active.has(t);
          return (
            <button
              key={t}
              type="button"
              className={`chip chip-${t} ${on ? "is-on" : "is-off"}`}
              aria-pressed={on}
              onClick={() => toggle(t)}
            >
              {trackLabels[t]}
            </button>
          );
        })}
      </div>
      <div className="xp-list">
        {roles.map((role, i) => (
          <ExperienceCard key={i} role={role} active={active} />
        ))}
      </div>
    </div>
  );
}
