import { useEffect, useRef, useState } from "react";
import { useTurnstile } from "../hooks/useTurnstile";

export type ContactStatus = "idle" | "sending" | "sent" | "error";

// Cloudflare's "always passes" test sitekey; overridden at build time by
// VITE_TURNSTILE_SITEKEY for production.
const TEST_SITEKEY = "1x00000000000000000000AA";
const SITEKEY = import.meta.env.VITE_TURNSTILE_SITEKEY || TEST_SITEKEY;

const ERROR_TEXT: Record<string, string> = {
  invalid_name: "Please enter your name.",
  invalid_email: "That email address does not look right.",
  invalid_message: "Please enter a message.",
  missing_token: "Please complete the verification.",
  verification_failed: "Verification failed. Please try again.",
  send_failed: "The message could not be sent. Please try again later.",
  network: "Network error. Please try again.",
};

export interface ContactFormProps {
  onStatusChange?: (status: ContactStatus) => void;
}

export function ContactForm({ onStatusChange }: ContactFormProps) {
  const { containerRef, token, ready, reset } = useTurnstile(SITEKEY);
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    setError(null);

    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      company: String(data.get("company") ?? ""), // honeypot
      token,
    };

    if (!token) {
      setError(ERROR_TEXT.missing_token);
      setStatus("error");
      return;
    }

    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (res.ok && body.ok) {
        setStatus("sent");
        form.reset();
        reset();
      } else {
        setError(ERROR_TEXT[body.error ?? ""] ?? ERROR_TEXT.send_failed);
        setStatus("error");
        reset();
      }
    } catch {
      setError(ERROR_TEXT.network);
      setStatus("error");
      reset();
    }
  }

  if (status === "sent") {
    return (
      <div className="contact-done" role="status">
        <p className="contact-done-title">Message sent.</p>
        <p>Thank you. I will be in touch.</p>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setStatus("idle")}
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} className="contact-form" onSubmit={onSubmit} noValidate>
      <div className="field">
        <label htmlFor="cf-name">Name</label>
        <input
          id="cf-name"
          name="name"
          type="text"
          autoComplete="name"
          maxLength={120}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="cf-email">Email</label>
        <input
          id="cf-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="cf-message">Message</label>
        <textarea
          id="cf-message"
          name="message"
          rows={5}
          maxLength={5000}
          required
        />
      </div>

      {/* honeypot: visually hidden, off-screen, not announced */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="cf-company">Company</label>
        <input id="cf-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="turnstile" ref={containerRef} />

      {error && (
        <p className="contact-error" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={status === "sending" || !ready}
      >
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
