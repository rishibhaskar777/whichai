"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MenuIcon } from "@/components/icons";
import { LocalDataProvider } from "@/components/local-data/LocalDataProvider";
import { NewsPanel, type NewsChoice } from "@/components/news-panel/NewsPanel";
import { KeyboardShortcuts } from "@/components/shortcuts/KeyboardShortcuts";
import { SignInProvider } from "@/components/sign-in/SignInProvider";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { Wordmark } from "@/components/wordmark/Wordmark";
import type { ProviderAvailability } from "@/lib/auth/config";
import type { Viewer } from "@/lib/auth/get-session";
import { useI18n } from "@/lib/i18n/provider";
import { NewPlanProvider } from "@/lib/new-plan-signal";
import type { ThemeChoice } from "@/lib/theme";
import type { NewsItem } from "@/data/sample/news";
import { useMediaQuery } from "@/lib/use-media-query";
import styles from "./AppShell.module.css";

interface AppShellProps {
  news: readonly NewsItem[];
  initialTheme: ThemeChoice;
  viewer: Viewer | null;
  providers: ProviderAvailability;
  children: ReactNode;
}

export function AppShell({
  news,
  initialTheme,
  viewer,
  providers,
  children,
}: AppShellProps) {
  const { t } = useI18n();
  const [railMode, setRailMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newsChoice, setNewsChoice] = useState<NewsChoice>("auto");
  const drawerRef = useRef<HTMLDialogElement>(null);

  const hasSideNews = useMediaQuery("(min-width: 1280px)", true);

  const newsExpanded =
    newsChoice === "auto" ? hasSideNews : newsChoice === "open";

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (drawerOpen && !drawer.open) drawer.showModal();
    if (!drawerOpen && drawer.open) drawer.close();
  }, [drawerOpen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 760px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <ToastProvider>
      <LocalDataProvider>
        <NewPlanProvider>
          <SignInProvider providers={providers}>
            <KeyboardShortcuts />
            <div
              className={styles.shell}
              data-print-reset=""
              data-sidebar={railMode ? "rail" : "full"}
              data-news={newsChoice}
            >
              <div
                className={styles.glow}
                aria-hidden="true"
                data-print-hide=""
              >
                <span className={styles.blobOne} />
                <span className={styles.blobTwo} />
                <span className={styles.blobThree} />
              </div>

              <a href="#main" className={styles.skipLink} data-print-hide="">
                {t("shell.skipToMain")}
              </a>

              <header className={styles.mobileBar} data-print-hide="">
                <button
                  type="button"
                  className={styles.menuButton}
                  onClick={() => setDrawerOpen(true)}
                  aria-label={t("shell.openMenu")}
                  aria-haspopup="dialog"
                >
                  <MenuIcon />
                </button>
                <Wordmark />
              </header>

              <div className={styles.sidebar} data-print-hide="">
                <SidebarContent
                  collapsed={railMode}
                  initialTheme={initialTheme}
                  viewer={viewer}
                  onToggleCollapse={() => setRailMode((current) => !current)}
                />
              </div>

              <dialog
                ref={drawerRef}
                className={styles.drawer}
                data-print-hide=""
                aria-label={t("shell.mainMenu")}
                onClose={closeDrawer}
                onClick={(event) => {
                  if (event.target === event.currentTarget) closeDrawer();
                }}
              >
                <SidebarContent
                  collapsed={false}
                  initialTheme={initialTheme}
                  viewer={viewer}
                  onClose={closeDrawer}
                />
              </dialog>

              <main id="main" tabIndex={-1} className={styles.main}>
                <div className={styles.content}>{children}</div>
              </main>

              <NewsPanel
                items={news}
                choice={newsChoice}
                expanded={newsExpanded}
                onToggle={() =>
                  setNewsChoice(newsExpanded ? "collapsed" : "open")
                }
              />
            </div>
          </SignInProvider>
        </NewPlanProvider>
      </LocalDataProvider>
    </ToastProvider>
  );
}
