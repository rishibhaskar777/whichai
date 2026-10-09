import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell/AppShell";
import { sampleNews } from "@/data/sample/news";
import { getProviderAvailability } from "@/lib/auth/config";
import { getViewer } from "@/lib/auth/get-session";
import { getEnv } from "@/lib/env";
import { I18nProvider } from "@/lib/i18n/provider";
import { getLocale } from "@/lib/i18n/server";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";
import { notoDevanagari, onest } from "./fonts";
import "@/styles/tokens.css";
import "@/styles/global.css";
import "@/styles/print.css";

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
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${onest.variable} ${notoDevanagari.variable}`}
    >
      <body>
        <I18nProvider locale={locale}>
          <AppShell
            news={sampleNews}
            initialTheme={theme ?? "system"}
            viewer={await getViewer()}
            providers={getProviderAvailability()}
          >
            {children}
          </AppShell>
        </I18nProvider>
      </body>
    </html>
  );
}
