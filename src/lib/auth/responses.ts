import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import type { AuthErrorCode } from "./errors";
import { safeRedirectPath } from "./redirect";

function siteOrigin(): string {
  return new URL(getEnv().NEXT_PUBLIC_SITE_URL).origin;
}

/*
 * Redirects are built from the configured site origin, never from the Host
 * header, and the path has already passed the allowlist.
 */
export function redirectTo(path: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, siteOrigin()), 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export function redirectWithError(
  error: AuthErrorCode,
  next: string | null | undefined,
): NextResponse {
  const query = new URLSearchParams({ error });
  const target = safeRedirectPath(next);
  if (target !== "/") query.set("next", target);
  return redirectTo(`/sign-in?${query.toString()}`);
}
