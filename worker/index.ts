/// <reference path="../worker-configuration.d.ts" />

import { handleOpsApi, handlePostsApi } from "./api";
import { insertContactMessage } from "./db";
import { json } from "./http";
import { plainNotFound } from "./not-found";
import { sessionIsValid } from "./session";

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  company?: unknown; // honeypot
  token?: unknown; // Turnstile token
}

interface TurnstileResult {
  success: boolean;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
}

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;
const MAX_TOKEN = 2048;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function contactAlreadyUsed(request: Request): boolean {
  const header = request.headers.get("cookie") ?? "";
  return header.split(";").some((part) => part.trim() === "contact_used=1");
}

function contactUsedCookie(request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `contact_used=1; Max-Age=600; Path=/; SameSite=Lax${secure}`;
}

// Turnstile dummy keys for local/testing are prefixed 1x/2x/3x. They do not
// echo a real action or hostname, so action/hostname are only enforced for a
// production (0x...) secret.
function isTestSecret(secret: string): boolean {
  return /^[123]x/.test(secret);
}

async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp: string | null,
  hostnames: Set<string>,
): Promise<boolean> {
  const strict = !isTestSecret(secret);
  if (strict && hostnames.size === 0) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  let result: TurnstileResult;
  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!res.ok) return false;
    result = (await res.json()) as TurnstileResult;
  } catch {
    return false;
  }

  if (!result.success) return false;
  if (!strict) return true;
  if (result.action !== "contact") return false;
  if (!result.hostname || !hostnames.has(result.hostname)) return false;
  return true;
}

async function handleContact(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return json({ ok: false, error: "unsupported_media_type" }, 415);
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  // Honeypot: real users never fill this hidden field.
  if (asString(payload.company) !== "") {
    // Pretend success so bots learn nothing.
    return json({ ok: true });
  }

  if (contactAlreadyUsed(request)) {
    return json({ ok: false, error: "already_sent" }, 429);
  }

  const name = asString(payload.name);
  const email = asString(payload.email);
  const message = asString(payload.message);
  const token = asString(payload.token);

  if (!name || name.length > MAX_NAME) {
    return json({ ok: false, error: "invalid_name" }, 400);
  }
  if (!email || email.length > MAX_EMAIL || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: "invalid_email" }, 400);
  }
  if (!message || message.length > MAX_MESSAGE) {
    return json({ ok: false, error: "invalid_message" }, 400);
  }
  if (!token || token.length > MAX_TOKEN) {
    return json({ ok: false, error: "missing_token" }, 400);
  }

  const hostnames = new Set(
    (env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean),
  );
  const remoteIp = request.headers.get("cf-connecting-ip");

  const passed = await verifyTurnstile(
    token,
    env.TURNSTILE_SECRET,
    remoteIp,
    hostnames,
  );
  if (!passed) {
    return json({ ok: false, error: "verification_failed" }, 403);
  }

  try {
    await insertContactMessage(env.DB, name, email, message);
  } catch (error) {
    console.error("contact store failed", error);
    return json({ ok: false, error: "store_failed" }, 502);
  }

  return json({ ok: true }, 200, { "set-cookie": contactUsedCookie(request) });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/contact") {
      return handleContact(request, env);
    }

    const postsResponse = await handlePostsApi(request, env, url);
    if (postsResponse) return postsResponse;

    const opsResponse = await handleOpsApi(request, env, url);
    if (opsResponse) return opsResponse;

    if (url.pathname.startsWith("/api/")) {
      return json({ ok: false, error: "not_found" }, 404);
    }

    if (!wantsDocument(request) || hasFileExtension(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    if (isOpsPath(url.pathname)) {
      const authed = await sessionIsValid(request.headers.get("cookie"), env.OPS_PASSWORD);
      if (!authed) return plainNotFound(url.pathname, request.method);
      if (url.pathname !== "/ops") {
        return Response.redirect(new URL("/ops", url).href, 308);
      }
      return env.ASSETS.fetch(request);
    }

    if (isAppRoute(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    return plainNotFound(url.pathname, request.method);
  },
} satisfies ExportedHandler<Env>;

function wantsDocument(request: Request): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

function hasFileExtension(pathname: string): boolean {
  const leaf = pathname.slice(pathname.lastIndexOf("/") + 1);
  return leaf.includes(".");
}

function isOpsPath(pathname: string): boolean {
  return pathname === "/ops" || pathname === "/ops/";
}

function isAppRoute(pathname: string): boolean {
  if (
    pathname === "/" ||
    pathname === "/blog" ||
    pathname === "/blog/" ||
    pathname === "/contact" ||
    pathname === "/contact/"
  ) {
    return true;
  }
  return /^\/blog\/[^/]+\/?$/.test(pathname);
}
