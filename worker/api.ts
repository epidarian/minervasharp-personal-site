import {
  deleteAllContactMessages,
  deleteContactMessage,
  deleteContactMessages,
  deletePost,
  getPost,
  listContactMessages,
  listPosts,
  savePost,
} from "./db";
import { json } from "./http";
import { plainNotFound } from "./not-found";
import type { PostDocument } from "./markdown";
import { documentFromFields, normalizeSlug, parseMarkdownFile, renderMarkdown } from "./markdown";
import {
  clearSessionCookie,
  passwordMatches,
  sessionCookie,
  sessionIsValid,
} from "./session";

const MAX_JSON = 150_000;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

async function readJson(request: Request): Promise<unknown | Response> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return json({ ok: false, error: "unsupported_media_type" }, 415);
  }
  const text = await request.text();
  if (text.length > MAX_JSON) return json({ ok: false, error: "too_large" }, 413);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }
}

async function requireSession(request: Request, env: Env): Promise<Response | null> {
  const ok = await sessionIsValid(request.headers.get("cookie"), env.OPS_PASSWORD);
  if (ok) return null;
  return json({ ok: false, error: "unauthorized" }, 401);
}

export async function handlePostsApi(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (url.pathname === "/api/posts" && request.method === "GET") {
    const posts = await listPosts(env.DB);
    return json({
      posts: posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        date: post.date,
        summary: post.summary,
      })),
    });
  }

  if (url.pathname.startsWith("/api/posts/") && request.method === "GET") {
    const slug = normalizeSlug(decodeURIComponent(url.pathname.slice("/api/posts/".length)));
    if (!slug || slug.includes("/")) return json({ ok: false, error: "not_found" }, 404);
    const post = await getPost(env.DB, slug);
    if (!post) return json({ ok: false, error: "not_found" }, 404);
    const document = parseMarkdownFile(post.markdown);
    return json({
      slug: post.slug,
      title: post.title,
      date: post.date,
      summary: post.summary,
      html: renderMarkdown((document?.body ?? "").trim()),
    });
  }

  return null;
}

export async function handleOpsApi(request: Request, env: Env, url: URL): Promise<Response | null> {
  if (!url.pathname.startsWith("/api/ops")) return null;

  if (url.pathname === "/api/ops/session" && request.method === "POST") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await request.text();
      if (text.length > 2000) return plainNotFound(url.pathname, "GET");
      const password = (new URLSearchParams(text).get("password") ?? "").trim();
      const match = await passwordMatches(password, env.OPS_PASSWORD);
      if (!match || !env.OPS_PASSWORD) return plainNotFound(url.pathname, "GET");
      return new Response(null, {
        status: 303,
        headers: {
          location: "/ops",
          "set-cookie": await sessionCookie(env.OPS_PASSWORD, request),
        },
      });
    }

    const body = await readJson(request);
    if (body instanceof Response) return body;
    const password = asString(
      body && typeof body === "object" && "password" in body
        ? (body as { password: unknown }).password
        : "",
    ).trim();
    const match = await passwordMatches(password, env.OPS_PASSWORD);
    if (!match || !env.OPS_PASSWORD) return json({ ok: false }, 401);
    return json({ ok: true }, 200, {
      "set-cookie": await sessionCookie(env.OPS_PASSWORD, request),
    });
  }

  if (url.pathname === "/api/ops/session" && request.method === "DELETE") {
    const denied = await requireSession(request, env);
    if (denied) return denied;
    return json({ ok: true }, 200, {
      "set-cookie": clearSessionCookie(request),
    });
  }

  if (url.pathname === "/api/ops/session" && request.method === "GET") {
    const denied = await requireSession(request, env);
    if (denied) return denied;
    return json({ ok: true });
  }

  if (url.pathname === "/api/ops/messages" && request.method === "GET") {
    const denied = await requireSession(request, env);
    if (denied) return denied;
    const messages = await listContactMessages(env.DB);
    return json({ messages });
  }

  if (url.pathname === "/api/ops/messages" && request.method === "DELETE") {
    const denied = await requireSession(request, env);
    if (denied) return denied;
    await deleteAllContactMessages(env.DB);
    return json({ ok: true });
  }

  if (url.pathname === "/api/ops/messages" && request.method === "POST") {
    const denied = await requireSession(request, env);
    if (denied) return denied;
    const body = await readJson(request);
    if (body instanceof Response) return body;
    const raw =
      body && typeof body === "object" && "ids" in body
        ? (body as { ids: unknown }).ids
        : null;
    if (!Array.isArray(raw) || raw.length === 0 || raw.length > 200) {
      return json({ ok: false, error: "invalid_id" }, 400);
    }
    const ids: number[] = [];
    for (const value of raw) {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
        return json({ ok: false, error: "invalid_id" }, 400);
      }
      ids.push(value);
    }
    await deleteContactMessages(env.DB, ids);
    return json({ ok: true });
  }

  if (url.pathname.startsWith("/api/ops/messages/") && request.method === "DELETE") {
    const denied = await requireSession(request, env);
    if (denied) return denied;
    const raw = url.pathname.slice("/api/ops/messages/".length);
    if (!/^[1-9]\d*$/.test(raw)) return json({ ok: false, error: "invalid_id" }, 400);
    await deleteContactMessage(env.DB, Number(raw));
    return json({ ok: true });
  }

  if (url.pathname === "/api/ops/posts" && request.method === "GET") {
    const denied = await requireSession(request, env);
    if (denied) return denied;
    const posts = await listPosts(env.DB);
    return json({
      posts: posts.map((post) => ({
        slug: post.slug,
        title: post.title,
        date: post.date,
        summary: post.summary,
        // The editor loads the body into a field, so hand back just the body
        // (older rows may still carry front matter; strip it on the way out).
        body: parseMarkdownFile(post.markdown)?.body ?? post.markdown,
      })),
    });
  }

  if (url.pathname === "/api/ops/posts" && request.method === "POST") {
    const denied = await requireSession(request, env);
    if (denied) return denied;
    const body = await readJson(request);
    if (body instanceof Response) return body;
    const record =
      body && typeof body === "object"
        ? (body as {
            slug?: unknown;
            title?: unknown;
            date?: unknown;
            summary?: unknown;
            body?: unknown;
            markdown?: unknown;
          })
        : {};
    const slug = normalizeSlug(asString(record.slug) || asString(record.title));
    if (!slug) return json({ ok: false, error: "invalid_slug" }, 400);

    // Prefer the structured form fields; fall back to a raw markdown file for
    // older callers that still post a single `markdown` string.
    const usesFields =
      record.title !== undefined ||
      record.body !== undefined ||
      record.summary !== undefined ||
      record.date !== undefined;
    const document: PostDocument | null = usesFields
      ? documentFromFields({
          title: asString(record.title),
          date: asString(record.date),
          summary: asString(record.summary),
          body: asString(record.body),
        })
      : parseMarkdownFile(asString(record.markdown));
    if (!document) return json({ ok: false, error: "invalid_markdown" }, 400);

    await savePost(env.DB, {
      slug,
      title: document.title,
      date: document.date,
      summary: document.summary,
      markdown: document.body,
    });
    return json({ ok: true, slug });
  }

  if (url.pathname.startsWith("/api/ops/posts/") && request.method === "DELETE") {
    const denied = await requireSession(request, env);
    if (denied) return denied;
    const slug = normalizeSlug(decodeURIComponent(url.pathname.slice("/api/ops/posts/".length)));
    if (!slug) return json({ ok: false, error: "invalid_slug" }, 400);
    await deletePost(env.DB, slug);
    return json({ ok: true });
  }

  return json({ ok: false, error: "not_found" }, 404);
}
