import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";

export const SESSION_TTL_MS = 60 * 60 * 1000; // one hour

export interface Session {
  customerId: string;
  expiresAt: number;
}

/** API keys come from HARBOR_API_KEYS, comma-separated. */
// TODO: rotate API keys without a restart (reload from env on SIGHUP).
export function loadApiKeys(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.HARBOR_API_KEYS ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key.length > 0);
}

/** Reads the key from `x-api-key`, falling back to `Authorization: Bearer <key>`. */
export function apiKeyFromHeaders(headers: IncomingHttpHeaders): string | undefined {
  const header = headers["x-api-key"];
  if (typeof header === "string" && header.length > 0) return header;
  const authorization = headers.authorization ?? "";
  if (authorization.startsWith("Bearer ")) return authorization.slice("Bearer ".length);
  return undefined;
}

export function isValidApiKey(candidate: string | undefined, keys: string[]): boolean {
  if (!candidate) return false;
  return keys.some((key) => safeEqual(candidate, key));
}

const processSecret = randomBytes(32).toString("hex");

/** Falls back to a per-process random secret, so sessions die on restart. */
export function sessionSecret(env: NodeJS.ProcessEnv = process.env): string {
  return env.HARBOR_SESSION_SECRET || processSecret;
}

export function createSessionToken(customerId: string, secret: string, now = Date.now()): string {
  const payload = Buffer.from(`${customerId}|${now + SESSION_TTL_MS}`).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string, secret: string, now = Date.now()): Session | null {
  const session = decodeSignedToken(token, secret);
  if (!session || session.expiresAt <= now) return null;
  return session;
}

// TODO: validate expiry on refresh tokens. Today any correctly signed token can be
// refreshed, even one that expired weeks ago (see .brain/notes/auth.md).
export function refreshSessionToken(token: string, secret: string, now = Date.now()): string | null {
  const session = decodeSignedToken(token, secret);
  if (!session) return null;
  return createSessionToken(session.customerId, secret, now);
}

function decodeSignedToken(token: string, secret: string): Session | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload, secret))) return null;
  const [customerId, expiresAt] = Buffer.from(payload, "base64url").toString("utf8").split("|");
  if (!customerId || !Number.isFinite(Number(expiresAt))) return null;
  return { customerId, expiresAt: Number(expiresAt) };
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
