"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { MenuIcon } from "@/components/icons";
import { NewsPanel, type NewsChoice } from "@/components/news-panel/NewsPanel";
import { SidebarContent } from "@/components/sidebar/SidebarContent";
import { Wordmark } from "@/components/wordmark/Wordmark";
import type { NewsItem } from "@/data/sample/news";
import { useMediaQuery } from "@/lib/use-media-query";
import styles from "./AppShell.module.css";

interface AppShellProps {
  news: readonly NewsItem[];
  children: ReactNode;
}

export function AppShell({ news, children }: AppShellProps) {
  const [railMode, setRailMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newsChoice, setNewsChoice] = useState<NewsChoice>("auto");
  const drawerRef = useRef<HTMLDialogElement>(null);

  const hasSideNews = useMediaQuery("(min-width: 1180px)", true);

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
    <div
      className={styles.shell}
      data-sidebar={railMode ? "rail" : "full"}
      data-news={newsChoice}
    >
      <a href="#main" className={styles.skipLink}>
        Skip to main content
      </a>

      <header className={styles.mobileBar}>
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-haspopup="dialog"
        >
          <MenuIcon />
        </button>
        <Wordmark />
      </header>

      <div className={styles.sidebar}>
        <SidebarContent
          collapsed={railMode}
          onToggleCollapse={() => setRailMode((current) => !current)}
        />
      </div>

      <dialog
        ref={drawerRef}
        className={styles.drawer}
        aria-label="Main menu"
        onClose={closeDrawer}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDrawer();
        }}
      >
        <SidebarContent collapsed={false} onClose={closeDrawer} />
      </dialog>

      <main id="main" tabIndex={-1} className={styles.main}>
        <div className={styles.content}>{children}</div>
      </main>

      <NewsPanel
        items={news}
        choice={newsChoice}
        expanded={newsExpanded}
        onToggle={() => setNewsChoice(newsExpanded ? "collapsed" : "open")}
      />
    </div>
  );
}
