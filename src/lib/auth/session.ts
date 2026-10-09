import { EncryptJWT, jwtDecrypt } from "jose";
import { z } from "zod";
import type { ProviderId } from "@/lib/env";

export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const SESSION_AUDIENCE = "whichai:session";
const MAX_NAME_LENGTH = 80;

export const sessionSchema = z.object({
  provider: z.enum(["google", "github"]),
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(MAX_NAME_LENGTH),
});

export interface SessionData {
  provider: ProviderId;
  id: string;
  name: string;
}

/*
 * One key per purpose, derived from AUTH_SECRET, so a token minted for one
 * purpose (session, sign-in transaction, CSRF) is useless for another.
 */
export async function deriveKey(
  secret: string,
  purpose: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const bytes = new TextEncoder().encode(`whichai:${purpose}:${secret}`);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

/* The cookie holds a JWE (A256GCM), so its contents are encrypted and tamper-evident. */
export async function encodeSession(
  data: SessionData,
  secret: string,
  nowMs: number = Date.now(),
): Promise<string> {
  const issuedAt = Math.floor(nowMs / 1000);
  return new EncryptJWT({ ...data })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + SESSION_MAX_AGE_SECONDS)
    .encrypt(await deriveKey(secret, "session"));
}

export async function decodeSession(
  token: string,
  secret: string,
  nowMs: number = Date.now(),
): Promise<SessionData | null> {
  try {
    const { payload } = await jwtDecrypt(
      token,
      await deriveKey(secret, "session"),
      {
        audience: SESSION_AUDIENCE,
        keyManagementAlgorithms: ["dir"],
        contentEncryptionAlgorithms: ["A256GCM"],
        currentDate: new Date(nowMs),
      },
    );
    const parsed = sessionSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/* Provider names can contain control characters or be very long. */
export function cleanDisplayName(
  raw: string | null | undefined,
): string | null {
  const cleaned = (raw ?? "")
    .replace(/[\p{Cc}\p{Cf}]/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME_LENGTH)
    .trim();
  return cleaned === "" ? null : cleaned;
}

export function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("");
  return letters === "" ? "?" : letters.toUpperCase();
}

interface CookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

/*
 * The __Host- prefix makes browsers refuse the cookie unless it is Secure,
 * has Path=/ and carries no Domain. It needs HTTPS, so development uses a
 * plain name.
 */
export function cookieName(base: string, isProduction: boolean): string {
  return isProduction ? `__Host-${base}` : base;
}

export function cookieOptions(
  isProduction: boolean,
  maxAge: number,
): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export const SESSION_COOKIE = "whichai_session";

export function sessionCookieName(isProduction: boolean): string {
  return cookieName(SESSION_COOKIE, isProduction);
}

export function sessionCookieOptions(isProduction: boolean): CookieOptions {
  return cookieOptions(isProduction, SESSION_MAX_AGE_SECONDS);
}
