import type { Role, Track } from "../content/resume";
import { trackLabels } from "../content/resume";

export interface ExperienceCardProps {
  role: Role;
  active: Set<Track>;
}

// A role rendered as a lit "storefront sign" card. Bullets filter by track.
export function ExperienceCard({ role, active }: ExperienceCardProps) {
  const bullets = role.bullets.filter((b) =>
    b.tags.some((t) => active.has(t)),
  );
  if (bullets.length === 0) return null;

  return (
    <article className="xp-card">
      <div className="xp-card-head">
        <h3 className="xp-title">{role.title}</h3>
        <p className="xp-meta">
          <span className="xp-org">{role.org}</span>
          <span className="xp-dot" aria-hidden="true">
            ·
          </span>
          <span className="xp-loc">{role.location}</span>
        </p>
        <p className="xp-period">{role.period}</p>
        {role.note && <p className="xp-note">{role.note}</p>}
      </div>
      <ul className="xp-bullets">
        {bullets.map((b, i) => (
          <li key={i}>
            <span className="xp-bullet-text">{b.text}</span>
            <span className="xp-bullet-tags">
              {b.tags.map((t) => (
                <span key={t} className={`tag tag-${t}`}>
                  {trackLabels[t]}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
