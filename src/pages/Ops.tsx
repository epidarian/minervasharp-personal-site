import { useEffect, useState, type FormEvent } from "react";
import { Backdrop } from "../components/Backdrop";
import { Nav } from "../components/Nav";
import { Grain } from "../effects/Grain";
import { identity } from "../content/resume";

interface StoredFile {
  slug: string;
  title: string;
  date: string;
  summary: string;
  body: string;
}

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

const BODY_PLACEHOLDER = `Write the post here. Plain markdown:

## A heading

A paragraph, **bold**, *italic*, [a link](https://example.com), and:

- a list item
- another item
`;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function readError(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (body.error === "invalid_slug") return "Use a file name like notes.md.";
  if (body.error === "invalid_markdown") {
    return "Add some text to the file (and keep it under 100 KB).";
  }
  if (body.error === "unauthorized") return "The session expired.";
  if (res.status === 401) return "";
  return "That did not save.";
}

export function Ops() {
  const [phase, setPhase] = useState<"check" | "ops">("check");
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayIso());
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"blog" | "messages">("blog");

  useEffect(() => {
    document.title = phase === "ops" ? `Ops · ${identity.name}` : "404 Not Found";
  }, [phase]);

  async function loadOps() {
    const [postRes, messageRes] = await Promise.all([
      fetch("/api/ops/posts"),
      fetch("/api/ops/messages"),
    ]);
    if (postRes.status === 401 || messageRes.status === 401) {
      window.location.replace("/ops");
      return;
    }
    if (!postRes.ok || !messageRes.ok) {
      setNotice("The database did not respond.");
      setPhase("ops");
      return;
    }
    const postBody = (await postRes.json()) as { posts?: StoredFile[] };
    const messageBody = (await messageRes.json()) as { messages?: ContactMessage[] };
    setFiles(postBody.posts ?? []);
    const nextMessages = messageBody.messages ?? [];
    setMessages(nextMessages);
    setSelected((current) => {
      const ids = new Set(nextMessages.map((message) => message.id));
      return new Set([...current].filter((id) => ids.has(id)));
    });
    setPhase("ops");
  }

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ops/session")
      .then((res) => {
        if (cancelled) return;
        if (res.ok) return loadOps();
        window.location.replace("/ops");
      })
      .catch(() => {
        if (!cancelled) window.location.replace("/ops");
      });
    return () => {
      cancelled = true;
    };
    // Session check runs once when the 404 document loads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setSlug("");
    setTitle("");
    setDate(todayIso());
    setSummary("");
    setBody("");
    setEditingSlug(null);
  }

  function editFile(file: StoredFile) {
    setSlug(file.slug);
    setTitle(file.title);
    setDate(file.date || todayIso());
    setSummary(file.summary);
    setBody(file.body);
    setEditingSlug(file.slug);
    setNotice(null);
  }

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    const outgoingSlug = slug.trim() || slugify(title);
    try {
      const res = await fetch("/api/ops/posts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug: outgoingSlug, title, date, summary, body }),
      });
      if (res.status === 401) {
        window.location.replace("/ops");
        return;
      }
      if (!res.ok) {
        setNotice(await readError(res));
        return;
      }
      const saved = (await res.json().catch(() => ({}))) as { slug?: string };
      setNotice("Saved.");
      if (saved.slug) {
        setSlug(saved.slug);
        setEditingSlug(saved.slug);
      }
      await loadOps();
    } catch {
      setNotice("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(fileSlug: string) {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/ops/posts/${encodeURIComponent(fileSlug)}`, {
        method: "DELETE",
      });
      if (res.status === 401) {
        window.location.replace("/ops");
        return;
      }
      if (!res.ok) {
        setNotice("That file was not deleted.");
        return;
      }
      if (slug.replace(/\.md$/i, "") === fileSlug) {
        resetForm();
      }
      await loadOps();
    } catch {
      setNotice("Network error.");
    } finally {
      setBusy(false);
    }
  }

  function toggleMessage(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onDeleteMessage(id: number) {
    await deleteMessages([id], "That message was not deleted.");
  }

  async function onDeleteSelected() {
    if (selected.size === 0) return;
    await deleteMessages([...selected], "Those messages were not deleted.");
  }

  async function onDeleteAll() {
    if (messages.length === 0) return;
    if (!window.confirm("Delete all messages?")) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/ops/messages", { method: "DELETE" });
      if (res.status === 401) {
        window.location.replace("/ops");
        return;
      }
      if (!res.ok) {
        setNotice("The messages were not deleted.");
        return;
      }
      setSelected(new Set());
      await loadOps();
    } catch {
      setNotice("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteMessages(ids: number[], failure: string) {
    setBusy(true);
    setNotice(null);
    try {
      const res =
        ids.length === 1
          ? await fetch(`/api/ops/messages/${ids[0]}`, { method: "DELETE" })
          : await fetch("/api/ops/messages", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ ids }),
            });
      if (res.status === 401) {
        window.location.replace("/ops");
        return;
      }
      if (!res.ok) {
        setNotice(failure);
        return;
      }
      setSelected((current) => {
        const next = new Set(current);
        for (const id of ids) next.delete(id);
        return next;
      });
      await loadOps();
    } catch {
      setNotice("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function onLogout() {
    await fetch("/api/ops/session", { method: "DELETE" });
    setFiles([]);
    setMessages([]);
    resetForm();
    setNotice(null);
    window.location.replace("/ops");
  }

  if (phase !== "ops") return null;

  return (
    <>
      <Backdrop />
      <Nav page="ops" />
      <main>
        <section className="section">
          <div className="section-inner is-wide">
              <div className="ops-grid">
                <div className="ops-head">
                  <p className="eyebrow">// OPS</p>
                  <h1 className="section-title">Operations</h1>
                  <button type="button" className="btn btn-ghost" onClick={onLogout}>
                    Lock
                  </button>
                </div>

                <div className="ops-tabs" role="tablist" aria-label="Operations">
                  <button
                    type="button"
                    role="tab"
                    id="ops-tab-blog"
                    aria-selected={tab === "blog"}
                    aria-controls="ops-panel-blog"
                    className={tab === "blog" ? "is-active" : undefined}
                    onClick={() => setTab("blog")}
                  >
                    Blog
                  </button>
                  <button
                    type="button"
                    role="tab"
                    id="ops-tab-messages"
                    aria-selected={tab === "messages"}
                    aria-controls="ops-panel-messages"
                    className={tab === "messages" ? "is-active" : undefined}
                    onClick={() => setTab("messages")}
                  >
                    Messages
                  </button>
                </div>

                {tab === "blog" ? (
                <form
                  className="ops-panel"
                  id="ops-panel-blog"
                  role="tabpanel"
                  aria-labelledby="ops-tab-blog"
                  onSubmit={onSave}
                >
                  <div className="ops-head">
                    <h2 className="subhead">
                      {editingSlug ? `Editing ${editingSlug}` : "New post"}
                    </h2>
                    {editingSlug && (
                      <button type="button" className="btn btn-ghost" onClick={resetForm}>
                        New post
                      </button>
                    )}
                  </div>
                  <p className="ops-note">
                    Fill in the fields. The post is published at /blog/&lt;slug&gt;.
                    Title and summary are taken from the body if left blank.
                  </p>
                  <div className="field">
                    <label htmlFor="ops-title">Title</label>
                    <input
                      id="ops-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="A note"
                      maxLength={200}
                    />
                  </div>
                  <div className="ops-field-row">
                    <div className="field">
                      <label htmlFor="ops-slug">Slug</label>
                      <input
                        id="ops-slug"
                        value={slug}
                        onChange={(event) => setSlug(event.target.value)}
                        placeholder="a-note (auto from title)"
                        maxLength={80}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="ops-date">Date</label>
                      <input
                        id="ops-date"
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="ops-summary">Summary</label>
                    <input
                      id="ops-summary"
                      value={summary}
                      onChange={(event) => setSummary(event.target.value)}
                      placeholder="One sentence for the index (optional)"
                      maxLength={500}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="ops-body">Body</label>
                    <textarea
                      id="ops-body"
                      className="ops-file"
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      placeholder={BODY_PLACEHOLDER}
                      spellCheck={false}
                    />
                  </div>
                  {notice && <p className="ops-note">{notice}</p>}
                  <div className="ops-actions">
                    <button type="submit" className="btn btn-primary" disabled={busy}>
                      {editingSlug ? "Save changes" : "Publish post"}
                    </button>
                  </div>
                  {files.length > 0 && (
                    <ul className="ops-files">
                      {files.map((file) => (
                        <li key={file.slug}>
                          <button
                            type="button"
                            className="ops-file-name"
                            onClick={() => editFile(file)}
                          >
                            {file.slug}
                          </button>
                          <span className="ops-file-meta">
                            {file.date} · {file.title}
                          </span>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            disabled={busy}
                            onClick={() => onDelete(file.slug)}
                          >
                            Delete
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </form>
                ) : (
                <section
                  className="ops-panel"
                  id="ops-panel-messages"
                  role="tabpanel"
                  aria-labelledby="ops-tab-messages"
                >
                  <div className="ops-head">
                    <h2 className="subhead">Contact messages</h2>
                    <button type="button" className="btn btn-ghost" onClick={() => loadOps()}>
                      Refresh
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy || selected.size === 0}
                      onClick={() => onDeleteSelected()}
                    >
                      Delete selected
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={busy || messages.length === 0}
                      onClick={() => onDeleteAll()}
                    >
                      Delete all
                    </button>
                  </div>
                  {notice && <p className="ops-note">{notice}</p>}
                  {messages.length === 0 ? (
                    <p className="ops-note">No messages yet.</p>
                  ) : (
                    <ul className="message-list">
                      {messages.map((message) => (
                        <li key={message.id} className="message-card">
                          <div className="message-card-head">
                            <label className="message-check">
                              <input
                                type="checkbox"
                                checked={selected.has(message.id)}
                                onChange={() => toggleMessage(message.id)}
                                aria-label={`Select message from ${message.name}`}
                              />
                            </label>
                            <p className="message-meta">
                              {message.created_at} · {message.name} · {message.email}
                            </p>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={busy}
                              onClick={() => onDeleteMessage(message.id)}
                            >
                              Delete
                            </button>
                          </div>
                          <p className="message-body">{message.message}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                )}
              </div>
          </div>
        </section>
      </main>
      <Grain />
    </>
  );
}
