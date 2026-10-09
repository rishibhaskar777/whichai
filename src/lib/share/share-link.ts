import {
  planRequestSchema,
  type PlanRequest,
} from "@/lib/schemas/plan-request";

/** Share links stay small enough to paste anywhere. */
export const MAX_FRAGMENT_LENGTH = 4096;

export type DecodeError = "too-large" | "malformed" | "invalid";

export type DecodeResult =
  { ok: true; request: PlanRequest } | { ok: false; error: DecodeError };

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Null when the encoded request would not fit in a share link. */
export function encodePlanRequest(request: PlanRequest): string | null {
  const bytes = new TextEncoder().encode(JSON.stringify(request));
  const encoded = toBase64Url(bytes);
  return encoded.length <= MAX_FRAGMENT_LENGTH ? encoded : null;
}

/**
 * The fragment is untrusted: it is size-limited, decoded, parsed as JSON and
 * checked against the strict request schema before anything uses it.
 */
export function decodePlanRequest(fragment: string): DecodeResult {
  const text = fragment.startsWith("#") ? fragment.slice(1) : fragment;
  if (text.length > MAX_FRAGMENT_LENGTH)
    return { ok: false, error: "too-large" };
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return { ok: false, error: "malformed" };

  let json: unknown;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      fromBase64Url(text),
    );
    json = JSON.parse(decoded);
  } catch {
    return { ok: false, error: "malformed" };
  }
  const parsed = planRequestSchema.safeParse(json);
  return parsed.success
    ? { ok: true, request: parsed.data }
    : { ok: false, error: "invalid" };
}

/** The request goes after the #, so browsers never send it to the server. */
export function buildShareUrl(
  origin: string,
  request: PlanRequest,
): string | null {
  const encoded = encodePlanRequest(request);
  return encoded === null ? null : `${origin}/plan#${encoded}`;
}
