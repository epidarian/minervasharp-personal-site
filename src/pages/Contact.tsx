import { useEffect } from "react";
import { Backdrop } from "../components/Backdrop";
import { Nav } from "../components/Nav";
import { ContactForm } from "../components/ContactForm";
import { Grain } from "../effects/Grain";
import { identity } from "../content/resume";

export function Contact() {
  useEffect(() => {
    document.title = `Contact · ${identity.name}`;
  }, []);

  return (
    <>
      <Backdrop />
      <Nav page="contact" />

      <main>
        <section className="section">
          <div className="section-inner is-wide">
            <p className="eyebrow">// CONTACT</p>
            <h1 className="section-title">Send Me Mail</h1>
            <div className="contact-grid">
              <div className="contact-intro">
                <p>Messages from this form are saved.</p>
                <p>
                  You can also find me on{" "}
                  <a
                    href={identity.linkedin}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    LinkedIn
                  </a>
                  .
                </p>
              </div>
              <ContactForm />
            </div>
          </div>
        </section>

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
