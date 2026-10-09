import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, isProduction } from "@/lib/auth/config";
import { isSameOrigin, verifyCsrfToken } from "@/lib/auth/csrf";
import { clientKey, signOutLimiter } from "@/lib/auth/rate-limit";
import { redirectTo } from "@/lib/auth/responses";
import { cookieOptions, sessionCookieName } from "@/lib/auth/session";

const MAX_BODY_BYTES = 4096;

function refuse(status: 403 | 429) {
  return new NextResponse("Request refused.", {
    status,
    headers: { "Cache-Control": "no-store", "Content-Type": "text/plain" },
  });
}

/*
 * Sign-out changes state, so it is POST only. It needs the form token that was
 * rendered for this session and a same-origin Origin header.
 */
export async function POST(request: NextRequest) {
  if (!signOutLimiter.allow(clientKey(request.headers))) return refuse(429);

  const config = getAuthConfig();
  if (!config) return refuse(403);

  const production = isProduction();
  const cookieName = sessionCookieName(production);
  const sessionToken = request.cookies.get(cookieName)?.value;
  if (!isSameOrigin(request.headers.get("origin"), config.siteOrigin)) {
    return refuse(403);
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (!(length <= MAX_BODY_BYTES)) return refuse(403);

  const form = await request.formData().catch(() => null);
  const csrf = form?.get("csrf");
  if (
    !sessionToken ||
    typeof csrf !== "string" ||
    !(await verifyCsrfToken(csrf, sessionToken, config.secret))
  ) {
    return refuse(403);
  }

  const response = redirectTo("/");
  response.cookies.set(cookieName, "", cookieOptions(production, 0));
  return response;
}
