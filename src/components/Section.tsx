import type { ReactNode } from "react";

export interface SectionProps {
  id: string;
  sceneIndex: number;
  eyebrow?: string;
  title?: string;
  children: ReactNode;
  wide?: boolean;
}

// A scroll section. `data-scene` tells the App which backdrop scene to show.
export function Section({
  id,
  sceneIndex,
  eyebrow,
  title,
  children,
  wide = false,
}: SectionProps) {
  return (
    <section id={id} data-scene={sceneIndex} className="section">
      <div className={wide ? "section-inner is-wide" : "section-inner"}>
        {eyebrow && <p className="eyebrow">// {eyebrow}</p>}
        {title && <h2 className="section-title">{title}</h2>}
        {children}
      </div>
    </section>
  );
}
