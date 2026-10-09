import type { NextRequest } from "next/server";
import { z } from "zod";
import { getAuthConfig, isProduction } from "@/lib/auth/config";
import { completeSignIn, isProviderId } from "@/lib/auth/providers";
import { callbackLimiter, clientKey } from "@/lib/auth/rate-limit";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { redirectTo, redirectWithError } from "@/lib/auth/responses";
import {
  cookieOptions,
  encodeSession,
  sessionCookieName,
  sessionCookieOptions,
} from "@/lib/auth/session";
import {
  decodeTransaction,
  stateMatches,
  transactionCookieName,
} from "@/lib/auth/transaction";

const callbackParamsSchema = z.object({
  code: z.string().min(1).max(2048),
  state: z.string().min(1).max(512),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const production = isProduction();
  const transactionCookie = transactionCookieName(production);

  if (!callbackLimiter.allow(clientKey(request.headers))) {
    return redirectWithError("rate-limited", null);
  }

  const config = getAuthConfig();
  const credentials = isProviderId(provider)
    ? config?.providers[provider]
    : undefined;
  if (!config || !isProviderId(provider) || !credentials) {
    return redirectWithError("not-configured", null);
  }

  const failed = (error: "failed" | "denied", next?: string) => {
    const response = redirectWithError(error, next);
    response.cookies.set(transactionCookie, "", cookieOptions(production, 0));
    return response;
  };

  const search = request.nextUrl.searchParams;
  const transactionToken = request.cookies.get(transactionCookie)?.value;
  const transaction = transactionToken
    ? await decodeTransaction(transactionToken, config.secret)
    : null;
  if (!transaction || transaction.provider !== provider)
    return failed("failed");

  const next = safeRedirectPath(transaction.next);
  if (search.get("error") !== null) return failed("denied", next);

  const callbackParams = callbackParamsSchema.safeParse({
    code: search.get("code"),
    state: search.get("state"),
  });
  if (
    !callbackParams.success ||
    !stateMatches(transaction.state, callbackParams.data.state)
  ) {
    return failed("failed", next);
  }

  try {
    const session = await completeSignIn(
      provider,
      credentials,
      config.siteOrigin,
      callbackParams.data.code,
      transaction.codeVerifier,
    );
    const response = redirectTo(next);
    response.cookies.set(
      sessionCookieName(production),
      await encodeSession(session, config.secret),
      sessionCookieOptions(production),
    );
    response.cookies.set(transactionCookie, "", cookieOptions(production, 0));
    return response;
  } catch {
    return failed("failed", next);
  }
}
