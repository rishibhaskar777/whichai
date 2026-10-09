import { NextResponse, type NextRequest } from "next/server";
import { getAuthConfig, isProduction } from "@/lib/auth/config";
import { createAuthorizationRequest, isProviderId } from "@/lib/auth/providers";
import { clientKey, signInLimiter } from "@/lib/auth/rate-limit";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { redirectWithError } from "@/lib/auth/responses";
import { cookieOptions } from "@/lib/auth/session";
import {
  TRANSACTION_MAX_AGE_SECONDS,
  encodeTransaction,
  transactionCookieName,
} from "@/lib/auth/transaction";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));

  if (!signInLimiter.allow(clientKey(request.headers))) {
    return redirectWithError("rate-limited", next);
  }

  const config = getAuthConfig();
  const credentials = isProviderId(provider)
    ? config?.providers[provider]
    : undefined;
  if (!config || !isProviderId(provider) || !credentials) {
    return redirectWithError("not-configured", next);
  }

  const authorization = createAuthorizationRequest(
    provider,
    credentials,
    config.siteOrigin,
  );
  const transaction = await encodeTransaction(
    {
      provider,
      state: authorization.state,
      codeVerifier: authorization.codeVerifier,
      next,
    },
    config.secret,
  );

  const response = NextResponse.redirect(authorization.url, 303);
  response.cookies.set(
    transactionCookieName(isProduction()),
    transaction,
    cookieOptions(isProduction(), TRANSACTION_MAX_AGE_SECONDS),
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
