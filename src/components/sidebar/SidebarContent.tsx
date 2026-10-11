"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  ChangesIcon,
  CloseIcon,
  CompareIcon,
  FolderIcon,
  HomeIcon,
  LibraryIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";
import { SidebarAccount } from "./AccountMenu";
import { RecentProjects } from "./RecentProjects";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/en";
import { useIsMac } from "@/components/shortcuts/KeyboardShortcuts";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import type { Viewer } from "@/lib/auth/get-session";
import type { ThemeChoice } from "@/lib/theme";
import { Wordmark } from "@/components/wordmark/Wordmark";
import styles from "./SidebarContent.module.css";

interface NavItem {
  href: string;
  label: MessageKey;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

interface NavGroup {
  label: MessageKey | null;
  items: readonly NavItem[];
}

const NAV_GROUPS: readonly NavGroup[] = [
  { label: null, items: [{ href: "/", label: "nav.home", Icon: HomeIcon }] },
  {
    label: "nav.section.work",
    items: [
      { href: "/projects", label: "nav.projects", Icon: FolderIcon },
      { href: "/searches", label: "nav.searches", Icon: SearchIcon },
    ],
  },
  {
    label: "nav.section.explore",
    items: [
      { href: "/tools", label: "nav.toolLibrary", Icon: LibraryIcon },
      { href: "/what-changed", label: "nav.whatChanged", Icon: ChangesIcon },
      { href: "/compare", label: "nav.compare", Icon: CompareIcon },
    ],
  },
];

interface SidebarContentProps {
  collapsed: boolean;
  initialTheme: ThemeChoice;
  viewer: Viewer | null;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

export function SidebarContent({
  collapsed,
  initialTheme,
  viewer,
  onToggleCollapse,
  onClose,
}: SidebarContentProps) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { request: requestNewPlan } = useNewPlanSignal();
  const mac = useIsMac();
  const closeDrawer = () => onClose?.();
  const startNewPlan = () => {
    requestNewPlan();
    closeDrawer();
  };
  const labelClass = collapsed ? styles.srOnly : styles.label;

  return (
    <div className={styles.sidebar} data-collapsed={collapsed}>
      <div className={styles.top}>
        {onClose ? (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onClose}
            aria-label={t("shell.closeMenu")}
          >
            <CloseIcon />
          </button>
        ) : null}
        <Link href="/" className={styles.brand} onClick={closeDrawer}>
          <Wordmark showName={!collapsed} />
        </Link>
        {onToggleCollapse ? (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onToggleCollapse}
            aria-label={collapsed ? t("sidebar.expand") : t("sidebar.collapse")}
            aria-expanded={!collapsed}
          >
            <PanelLeftIcon />
          </button>
        ) : null}
      </div>

      <Link
        href="/"
        className={styles.newPlan}
        aria-keyshortcuts={mac ? "Meta+Shift+O" : "Control+Shift+O"}
        onClick={startNewPlan}
      >
        <PlusIcon />
        <span className={labelClass}>{t("nav.newPlan")}</span>
        {collapsed ? null : (
          <kbd className={styles.shortcutHint} aria-hidden="true">
            {mac ? "⌘⇧O" : "Ctrl+Shift+O"}
          </kbd>
        )}
      </Link>

      <nav aria-label={t("nav.primary")} className={styles.nav}>
        {NAV_GROUPS.map(({ label: groupLabel, items }) => (
          <div key={groupLabel ?? "home"} className={styles.group}>
            {groupLabel ? (
              <>
                <p
                  id={`nav-group-${groupLabel}`}
                  className={collapsed ? styles.groupRule : styles.groupLabel}
                >
                  {collapsed ? null : t(groupLabel)}
                </p>
              </>
            ) : null}
            <ul
              className={styles.list}
              aria-labelledby={
                groupLabel && !collapsed ? `nav-group-${groupLabel}` : undefined
              }
            >
              {items.map(({ href, label, Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={styles.link}
                    aria-current={pathname === href ? "page" : undefined}
                    onClick={closeDrawer}
                  >
                    <Icon />
                    <span className={labelClass}>{t(label)}</span>
                  </Link>
                  {href === "/projects" && !collapsed ? (
                    <RecentProjects onNavigate={closeDrawer} />
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className={styles.bottom} data-print-hide="" data-menu-anchor="">
        <SidebarAccount
          viewer={viewer}
          collapsed={collapsed}
          initialTheme={initialTheme}
          onNavigate={closeDrawer}
        />
      </div>
    </div>
  );
}
