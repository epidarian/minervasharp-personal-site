import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Backdrop } from "./components/Backdrop";
import { Nav } from "./components/Nav";
import { Section } from "./components/Section";
import { Experience } from "./components/Experience";
import { ProjectCard } from "./components/ProjectCard";
import { SiteTray } from "./components/SiteTray";
import { YearCounter } from "./components/YearCounter";
import { Grain } from "./effects/Grain";
import {
  identity,
  summary,
  devopsSince,
  likes,
  passes,
  skillGroups,
  projects,
  education,
  certifications,
  earlyCareer,
} from "./content/resume";

export default function App() {
  const [activeId, setActiveId] = useState("hero");
  const exportRef = useRef<HTMLAnchorElement>(null);

  const ratios = useRef<Map<Element, number>>(new Map());

  useEffect(() => {
    const nav = document.querySelector<HTMLElement>(".nav");
    const button = exportRef.current;
    if (!nav || !button) return;

    const place = () => {
      button.style.top = `${nav.getBoundingClientRect().bottom + 16}px`;
    };

    place();
    const observer = new ResizeObserver(place);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (window.location.hash === "#contact") {
      window.location.replace("/contact");
    }
  }, []);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("section[data-scene]"),
    );
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          ratios.current.set(e.target, e.isIntersecting ? e.intersectionRatio : 0);
        }
        let best: Element | null = null;
        let bestRatio = 0;
        for (const [el, ratio] of ratios.current) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            best = el;
          }
        }
        if (best instanceof HTMLElement) {
          setActiveId(best.id);
        }
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "-10% 0px -40% 0px",
      },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Backdrop />

      <Nav activeId={activeId} />

      <Link ref={exportRef} className="resume-export" to="/resume">
        <span className="resume-export-mark">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2.5v6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path
              d="M8.25 6.25 12 2.5 15.75 6.25"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M5 11.5v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="resume-export-label">Export Resume</span>
      </Link>

      <main>
        {/* Hero */}
        <section id="hero" data-scene={0} className="section section-hero">
          <div className="section-inner">
            <p className="hero-kicker">{identity.location}</p>
            <h1 className="hero-name">{identity.name}</h1>
            <p className="hero-title">{identity.title}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/contact">
                Get in touch
              </Link>
              <SiteTray />
            </div>
          </div>
        </section>

        {/* Summary */}
        <Section id="about" sceneIndex={1} eyebrow="ABOUT" title="How I work">
          <div className="prose about">
            <YearCounter since={devopsSince} label="Years in DevOps" />
            {summary.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <div className="about-lists">
              <div>
                <h3 className="about-list-title">I like:</h3>
                <ul>
                  {likes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="about-list-title">Pass!:</h3>
                <ul>
                  {passes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* Experience */}
        <Section id="experience" sceneIndex={2} eyebrow="EXPERIENCE" title="Where I've Worked" wide>
          <Experience />
        </Section>

        {/* Skills + Projects */}
        <Section id="skills" sceneIndex={3} eyebrow="SKILLS & PROJECTS" title="My Toolkit" wide>
          <div className="skills-grid">
            {skillGroups.map((group) => (
              <div key={group.label} className="skill-group">
                <h3 className="skill-label">{group.label}</h3>
                <ul className="skill-chips">
                  {group.items.map((item) => (
                    <li key={item} className="skill-chip">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="projects-head">
            <h3 className="subhead">Projects</h3>
            <p className="projects-lead">
              Tools I wrote and relevant projects
            </p>
          </div>
          <div className="projects">
            {projects.map((p) => (
              <ProjectCard key={p.name} project={p} />
            ))}
          </div>
        </Section>

        {/* Education / Certifications */}
        <Section id="education" sceneIndex={3} eyebrow="EDUCATION & CREDENTIALS" title="The Paper Trail" wide>
          <div className="edu-grid">
            <div>
              <h3 className="subhead">Education</h3>
              <ul className="edu-list">
                {education.map((e) => (
                  <li key={e.credential}>
                    <span className="edu-cred">{e.credential}</span>
                    <span className="edu-school">{e.school}</span>
                    <span className="edu-detail">{e.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="subhead">Certifications</h3>
              <ul className="cert-list">
                {certifications.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="subhead">Early career</h3>
              <ul className="early-list">
                {earlyCareer.map((e) => (
                  <li key={e.title + e.period}>
                    <span className="early-title">{e.title}</span>
                    <span className="early-org">{e.org}</span>
                    <span className="early-period">{e.period}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <footer className="footer">
          <p>{identity.nameMark}</p>
          <p className="footer-dim">
            &copy; {new Date().getFullYear()} {identity.name} ·{" "}
            {identity.location}
          </p>
        </footer>
      </main>

      <Grain />
    </>
  );
}
