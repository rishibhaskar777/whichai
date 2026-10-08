import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/AppShell";
import { sampleNews } from "@/data/sample/news";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { fraunces, instrumentSans } from "./fonts";
import "@/styles/tokens.css";
import "@/styles/global.css";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Reading request headers opts every page into per-request rendering,
  // which Next.js needs in order to apply the CSP nonce to its scripts.
  await headers();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);

  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${fraunces.variable} ${instrumentSans.variable}`}
    >
      <body>
        <AppShell news={sampleNews}>{children}</AppShell>
      </body>
    </html>
  );
}
