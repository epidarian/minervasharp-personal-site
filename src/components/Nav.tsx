import { Link } from "react-router";
import { identity } from "../content/resume";

export interface NavLink {
  id: string;
  label: string;
}

const links: NavLink[] = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
  { id: "contact", label: "Contact" },
];

export interface NavProps {
  activeId?: string;
  // When true, the nav renders on a blog route: the mark links home, section
  // links point at `/#id`, and the Blog link is marked active.
  onBlog?: boolean;
}

export function Nav({ activeId, onBlog = false }: NavProps) {
  const sectionHref = (id: string) =>
    onBlog ? `${import.meta.env.BASE_URL}#${id}` : `#${id}`;

  return (
    <header className="nav">
      {onBlog ? (
        <Link className="nav-mark" to="/">
          <span className="nav-prompt" aria-hidden="true">$ </span>
          {identity.name}
          <span className="nav-cursor" aria-hidden="true">_</span>
        </Link>
      ) : (
        <a className="nav-mark" href="#hero">
          <span className="nav-prompt" aria-hidden="true">$ </span>
          {identity.name}
          <span className="nav-cursor" aria-hidden="true">_</span>
        </a>
      )}
      <nav aria-label="Sections">
        <ul>
          {links.map((l) => (
            <li key={l.id}>
              <a
                href={sectionHref(l.id)}
                className={!onBlog && activeId === l.id ? "is-active" : undefined}
                aria-current={!onBlog && activeId === l.id ? "true" : undefined}
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <Link
              to="/blog"
              className={onBlog ? "is-active" : undefined}
              aria-current={onBlog ? "true" : undefined}
            >
              Blog
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
