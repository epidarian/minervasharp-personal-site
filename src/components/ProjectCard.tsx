import type { Project } from "../content/resume";

export function ProjectCard({ project }: { project: Project }) {
  const title = project.href ? (
    <a href={project.href} target="_blank" rel="noreferrer noopener">
      {project.name}
    </a>
  ) : (
    project.name
  );

  return (
    <article className="project-card">
      <div className="project-top">
        <h4>{title}</h4>
        {project.href && (
          <a
            className="project-link"
            href={project.href}
            target="_blank"
            rel="noreferrer noopener"
          >
            GitHub
            <span aria-hidden="true"> ↗</span>
          </a>
        )}
      </div>
      <p>{project.blurb}</p>
      {project.points && project.points.length > 0 && (
        <ul className="project-points">
          {project.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      )}
      {project.stack && project.stack.length > 0 && (
        <ul className="project-stack">
          {project.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
