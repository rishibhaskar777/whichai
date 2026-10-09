import { deriveKey } from "./session";

function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

async function hmacKey(secret: string, usage: KeyUsage) {
  return crypto.subtle.importKey(
    "raw",
    await deriveKey(secret, "csrf"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage],
  );
}

/*
 * The token is an HMAC of the session cookie value, so it is tied to one
 * sign-in and cannot be guessed or reused after signing in again.
 */
export async function createCsrfToken(
  sessionToken: string,
  secret: string,
): Promise<string> {
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(secret, "sign"),
    new TextEncoder().encode(sessionToken),
  );
  return toBase64Url(new Uint8Array(signature));
}

export async function verifyCsrfToken(
  token: string,
  sessionToken: string,
  secret: string,
): Promise<boolean> {
  try {
    return await crypto.subtle.verify(
      "HMAC",
      await hmacKey(secret, "verify"),
      Buffer.from(token, "base64url"),
      new TextEncoder().encode(sessionToken),
    );
  } catch {
    return false;
  }
}

/* Browsers always send Origin on a POST; a missing or foreign one is refused. */
export function isSameOrigin(
  originHeader: string | null,
  siteOrigin: string,
): boolean {
  return originHeader !== null && originHeader === siteOrigin;
}
