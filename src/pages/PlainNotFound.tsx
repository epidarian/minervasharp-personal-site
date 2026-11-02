import { useEffect, type FormEvent } from "react";

export function PlainNotFound() {
  const path = `${window.location.pathname}${window.location.search}`;

  useEffect(() => {
    document.documentElement.classList.add("plain-404");
    document.title = "404 Not Found";
    return () => document.documentElement.classList.remove("plain-404");
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("password");
    const password = input instanceof HTMLInputElement ? input.value : "";
    const res = await fetch("/api/ops/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      window.location.replace("/ops");
      return;
    }
    if (input instanceof HTMLInputElement) input.value = "";
  }

  return (
    <>
      <h1>Not Found</h1>
      <p>The requested URL {path} was not found on this server.</p>
      <hr />
      <form method="post" action="/api/ops/session" autoComplete="off" onSubmit={onSubmit}>
        <input
          type="text"
          name="password"
          aria-label="Access"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="off"
        />
      </form>
    </>
  );
}
