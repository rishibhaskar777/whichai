"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  ChangesIcon,
  CloseIcon,
  CompareIcon,
  FolderIcon,
  HelpIcon,
  HomeIcon,
  LibraryIcon,
  PanelLeftIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
} from "@/components/icons";
import { AccountMenu } from "./AccountMenu";
import { RecentProjects } from "./RecentProjects";
import { SignInButton } from "./SignInButton";
import { ThemeControl } from "@/components/theme-control/ThemeControl";
import { useI18n } from "@/lib/i18n/provider";
import type { MessageKey } from "@/lib/i18n/en";
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

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "nav.home", Icon: HomeIcon },
  { href: "/projects", label: "nav.projects", Icon: FolderIcon },
  { href: "/searches", label: "nav.searches", Icon: SearchIcon },
  { href: "/tool-library", label: "nav.toolLibrary", Icon: LibraryIcon },
  { href: "/what-changed", label: "nav.whatChanged", Icon: ChangesIcon },
  { href: "/compare-plans", label: "nav.comparePlans", Icon: CompareIcon },
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

      <Link href="/" className={styles.newPlan} onClick={startNewPlan}>
        <PlusIcon />
        <span className={labelClass}>{t("nav.newPlan")}</span>
      </Link>

      <nav aria-label={t("nav.primary")} className={styles.nav}>
        <ul className={styles.list}>
          {NAV_ITEMS.map(({ href, label, Icon }) => (
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
      </nav>

      <div className={styles.bottom} data-print-hide="">
        <div className={styles.footerLinks}>
          <Link
            href="/settings"
            className={styles.link}
            aria-current={pathname === "/settings" ? "page" : undefined}
            onClick={closeDrawer}
          >
            <SettingsIcon />
            <span className={labelClass}>{t("nav.settings")}</span>
          </Link>
          <Link
            href="/help"
            className={styles.link}
            aria-current={pathname === "/help" ? "page" : undefined}
            onClick={closeDrawer}
          >
            <HelpIcon />
            <span className={labelClass}>{t("nav.help")}</span>
          </Link>
        </div>
        {viewer ? (
          <AccountMenu viewer={viewer} collapsed={collapsed} />
        ) : (
          <SignInButton collapsed={collapsed} />
        )}
        <ThemeControl initialChoice={initialTheme} compact={collapsed} />
      </div>
    </div>
  );
}
