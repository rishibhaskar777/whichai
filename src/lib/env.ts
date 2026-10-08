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
