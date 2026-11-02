import { useEffect } from "react";
import { Link } from "react-router";
import {
  certifications,
  earlyCareer,
  education,
  identity,
  profiles,
  projects,
  roles,
  skillGroups,
  summary,
} from "../content/resume";

function bareUrl(href: string): string {
  return href.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

export function Resume() {
  const github = profiles.find((p) => p.id === "github");

  useEffect(() => {
    document.title = `${identity.name} — Resume`;
  }, []);

  return (
    <div className="resume-page">
      <div className="resume-toolbar">
        <Link to="/">Back</Link>
        <button type="button" className="resume-print" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <article className="resume-sheet">
        <header className="resume-head">
          <h1>{identity.name}</h1>
          <p className="resume-headline">{identity.title}</p>
          <p className="resume-contact">
            <span>{identity.location}</span>
            <a href={identity.linkedin}>{bareUrl(identity.linkedin)}</a>
            {github ? <a href={github.href}>{bareUrl(github.href)}</a> : null}
          </p>
        </header>

        <section>
          <h2>Summary</h2>
          {summary.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </section>

        <section>
          <h2>Experience</h2>
          {roles.map((role) => (
            <div key={role.org + role.period} className="resume-role">
              <div className="resume-role-line">
                <h3>{role.title}</h3>
                <span>{role.period}</span>
              </div>
              <p className="resume-org">
                {role.org}
                <span> · {role.location}</span>
              </p>
              {role.note ? <p className="resume-note">{role.note}</p> : null}
              <ul>
                {role.bullets.map((b) => (
                  <li key={b.text}>{b.text}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section>
          <h2>Skills</h2>
          <ul className="resume-skills">
            {skillGroups.map((group) => (
              <li key={group.label}>
                <strong>{group.label}.</strong> {group.items.join(", ")}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>Projects</h2>
          {projects.map((project) => (
            <div key={project.name} className="resume-role">
              <div className="resume-role-line">
                <h3>
                  {project.href ? (
                    <a href={project.href}>{project.name}</a>
                  ) : (
                    project.name
                  )}
                </h3>
                {project.stack ? <span>{project.stack.join(", ")}</span> : null}
              </div>
              <p>{project.blurb}</p>
            </div>
          ))}
        </section>

        <section>
          <h2>Education</h2>
          {education.map((e) => (
            <div key={e.credential} className="resume-role-line">
              <p>
                <strong>{e.credential}</strong>, {e.school}
              </p>
              <span>{e.detail}</span>
            </div>
          ))}
        </section>

        <section>
          <h2>Certifications</h2>
          <p>{certifications.join(" · ")}</p>
        </section>

        <section>
          <h2>Earlier roles</h2>
          {earlyCareer.map((e) => (
            <div key={e.title + e.period} className="resume-role-line">
              <p>
                <strong>{e.title}</strong>, {e.org}
              </p>
              <span>{e.period}</span>
            </div>
          ))}
        </section>
      </article>
    </div>
  );
}
