import { getEnv } from "@/lib/env";

const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 182;

export const dynamic = "force-dynamic";

export function GET() {
  const expires = new Date(Date.now() + SIX_MONTHS_MS).toISOString();
  const body = [
    "Contact: mailto:rishibhaskar254@gmail.com",
    `Expires: ${expires}`,
    "Preferred-Languages: en",
    `Canonical: ${getEnv().NEXT_PUBLIC_SITE_URL}/.well-known/security.txt`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
