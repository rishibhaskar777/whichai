import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/AppShell";
import { sampleNews } from "@/data/sample/news";
import { getEnv } from "@/lib/env";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { fraunces, instrumentSans } from "./fonts";
import "@/styles/tokens.css";
import "@/styles/global.css";

const SITE_NAME = "WhichAI";
const DESCRIPTION =
  "A neutral guide to which AI tools to use for your goal, with one plan at three levels: Simple, Polished and Advanced.";

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(getEnv().NEXT_PUBLIC_SITE_URL),
    title: {
      default: "WhichAI: which AI tools to use for your goal",
      template: "%s | WhichAI",
    },
    description: DESCRIPTION,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title: "WhichAI: which AI tools to use for your goal",
      description: DESCRIPTION,
      url: "/",
    },
    twitter: { card: "summary" },
  };
}

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
