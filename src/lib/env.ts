import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url({
    protocol: /^https?$/,
    error: "NEXT_PUBLIC_SITE_URL must be an absolute http(s) URL",
  }),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables:\n${problems}\nCopy .env.example to .env.local and fill in the values.`,
    );
  }
  return result.data;
}

let cached: Env | undefined;

export function getEnv(): Env {
  cached ??= parseEnv({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });
  return cached;
}

/*
 * 32 random bytes are 43 characters in unpadded base64 and 64 in hex, so a
 * shorter value cannot hold 32 bytes of entropy.
 */
const MIN_SECRET_LENGTH = 43;

const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(MIN_SECRET_LENGTH).optional(),
  GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
});

export type ProviderId = "google" | "github";

interface ProviderCredentials {
  clientId: string;
  clientSecret: string;
}

export interface AuthEnv {
  secret: string;
  providers: Partial<Record<ProviderId, ProviderCredentials>>;
}

/*
 * Sign-in is optional. Anything missing or malformed turns it off instead of
 * stopping the app, and only variable names are reported, never values.
 */
export function parseAuthEnv(
  source: Record<string, string | undefined>,
  { quiet = false }: { quiet?: boolean } = {},
): AuthEnv | null {
  const result = authEnvSchema.safeParse({
    AUTH_SECRET: emptyToUndefined(source.AUTH_SECRET),
    GOOGLE_CLIENT_ID: emptyToUndefined(source.GOOGLE_CLIENT_ID),
    GOOGLE_CLIENT_SECRET: emptyToUndefined(source.GOOGLE_CLIENT_SECRET),
    GITHUB_CLIENT_ID: emptyToUndefined(source.GITHUB_CLIENT_ID),
    GITHUB_CLIENT_SECRET: emptyToUndefined(source.GITHUB_CLIENT_SECRET),
  });
  if (!result.success) {
    const names = result.error.issues.map((issue) => issue.path.join("."));
    if (!quiet) {
      console.warn(`Sign-in disabled, invalid variables: ${names.join(", ")}`);
    }
    return null;
  }

  const env = result.data;
  if (!env.AUTH_SECRET) return null;

  const providers: AuthEnv["providers"] = {};
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    };
  }
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    };
  }
  if (Object.keys(providers).length === 0) return null;
  return { secret: env.AUTH_SECRET, providers };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  return value === undefined || value.trim() === "" ? undefined : value;
}

const PROVIDER_LABELS = { google: "Google", github: "GitHub" } as const;

/*
 * One line naming the variables to set (never their values), or null when
 * both providers are ready.
 */
export function authSetupWarning(
  source: Record<string, string | undefined>,
): string | null {
  const auth = parseAuthEnv(source, { quiet: true });
  const missing = (["google", "github"] as const).filter(
    (provider) => !auth?.providers[provider],
  );
  if (missing.length === 0) return null;

  const names = missing.flatMap((provider) => [
    `${provider.toUpperCase()}_CLIENT_ID`,
    `${provider.toUpperCase()}_CLIENT_SECRET`,
  ]);
  if (!auth) names.unshift("AUTH_SECRET");
  const labels = missing.map((provider) => PROVIDER_LABELS[provider]);
  return `Sign-in with ${labels.join(" and ")} is not configured and shows "coming soon". Check ${names.join(", ")} in .env.local (see docs/AUTH-SETUP.md).`;
}

let cachedAuth: AuthEnv | null | undefined;

export function getAuthEnv(): AuthEnv | null {
  if (cachedAuth !== undefined) return cachedAuth;
  const source = {
    AUTH_SECRET: process.env.AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  };
  cachedAuth = parseAuthEnv(source);
  const warning =
    process.env.NODE_ENV === "development" ? authSetupWarning(source) : null;
  if (warning) console.warn(warning);
  return cachedAuth;
}
