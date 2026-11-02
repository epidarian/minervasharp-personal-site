const COOKIE = "ops_session";
const TTL_SECONDS = 12 * 60 * 60;

function bytesToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return bytesToBase64Url(signature);
}

// Hash both sides first so the comparison is fixed-length and does not leak
// the secret's length through an early return.
export async function equalSecret(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

function readCookies(header: string | null, name: string): string[] {
  if (!header) return [];
  const values: string[] = [];
  for (const part of header.split(";")) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    if (trimmed.slice(0, eq) === name) values.push(trimmed.slice(eq + 1));
  }
  return values;
}

export async function passwordMatches(
  provided: string,
  secret: string | undefined,
): Promise<boolean> {
  if (!secret || provided.length === 0 || provided.length > 200) return false;
  return equalSecret(provided, secret);
}

export async function sessionIsValid(
  cookieHeader: string | null,
  secret: string | undefined,
): Promise<boolean> {
  if (!secret) return false;
  for (const raw of readCookies(cookieHeader, COOKIE)) {
    if (await tokenIsValid(raw, secret)) return true;
  }
  return false;
}

async function tokenIsValid(raw: string, secret: string): Promise<boolean> {
  const dot = raw.indexOf(".");
  if (dot <= 0) return false;
  const expStr = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  if (!/^\d{1,16}$/.test(expStr) || sig.length < 20 || sig.length > 200) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) return false;
  const expected = await hmac(secret, `ops.${expStr}`);
  return equalSecret(sig, expected);
}

export async function sessionCookie(secret: string, request: Request): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const sig = await hmac(secret, `ops.${exp}`);
  return cookieHeader(`${exp}.${sig}`, request, TTL_SECONDS);
}

export function clearSessionCookie(request: Request): string {
  return cookieHeader("", request, 0);
}

function cookieHeader(value: string, request: Request, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:";
  const parts = [
    `${COOKIE}=${value}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}
