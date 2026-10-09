import { getAuthEnv, getEnv, type ProviderId } from "@/lib/env";
import type { ProviderCredentials } from "./providers";

export interface AuthConfig {
  secret: string;
  siteOrigin: string;
  providers: Partial<Record<ProviderId, ProviderCredentials>>;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/* Null when sign-in is not set up; callers show a message instead of failing. */
export function getAuthConfig(): AuthConfig | null {
  const auth = getAuthEnv();
  if (!auth) return null;
  return {
    secret: auth.secret,
    siteOrigin: new URL(getEnv().NEXT_PUBLIC_SITE_URL).origin,
    providers: auth.providers,
  };
}

export interface ProviderAvailability {
  google: boolean;
  github: boolean;
}

export function getProviderAvailability(): ProviderAvailability {
  const providers = getAuthConfig()?.providers ?? {};
  return {
    google: Boolean(providers.google),
    github: Boolean(providers.github),
  };
}
