import { Link } from "react-router";
import { identity } from "../content/resume";

export interface NavLink {
  id: string;
  label: string;
}

// Anchors into the single-page home. Contact is no longer here; it is its own
// page in the right-hand group.
const sections: NavLink[] = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "education", label: "Education" },
];

export type NavPage = "home" | "blog" | "contact" | "ops";

export interface NavProps {
  activeId?: string;
  page?: NavPage;
}

export function Nav({ activeId, page = "home" }: NavProps) {
  const isHome = page === "home";
  const sectionHref = (id: string) => (isHome ? `#${id}` : `/#${id}`);

  const mark = (
    <>
      <span className="nav-prompt" aria-hidden="true">$ </span>
      {identity.name}
      <span className="nav-cursor" aria-hidden="true">_</span>
    </>
  );

  return (
    <header className="nav">
      {isHome ? (
        <a className="nav-mark" href="#hero">
          {mark}
        </a>
      ) : (
        <Link className="nav-mark" to="/">
          {mark}
        </Link>
      )}

      <nav className="nav-sections" aria-label="Sections">
        <ul>
          {sections.map((l) => {
            const active = isHome && activeId === l.id;
            return (
              <li key={l.id}>
                <a
                  href={sectionHref(l.id)}
                  className={active ? "is-active" : undefined}
                  aria-current={active ? "true" : undefined}
                >
                  {l.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav className="nav-pages" aria-label="Pages">
        <ul>
          <li>
            <Link
              to="/blog"
              className={page === "blog" ? "is-active" : undefined}
              aria-current={page === "blog" ? "true" : undefined}
            >
              Blog
            </Link>
          </li>
          <li>
            <Link
              to="/contact"
              className={page === "contact" ? "is-active" : undefined}
              aria-current={page === "contact" ? "true" : undefined}
            >
              Contact
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
