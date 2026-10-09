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
import { AccountMenu } from "./AccountMenu";
import { SignInButton } from "./SignInButton";
import { ThemeControl } from "@/components/theme-control/ThemeControl";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import type { Viewer } from "@/lib/auth/get-session";
import type { ThemeChoice } from "@/lib/theme";
import { Wordmark } from "@/components/wordmark/Wordmark";
import styles from "./SidebarContent.module.css";

interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/projects", label: "Projects", Icon: FolderIcon },
  { href: "/searches", label: "Searches", Icon: SearchIcon },
  { href: "/tool-library", label: "Tool Library", Icon: LibraryIcon },
  { href: "/what-changed", label: "What Changed", Icon: ChangesIcon },
  { href: "/compare-plans", label: "Compare Plans", Icon: CompareIcon },
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
            aria-label="Close menu"
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
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            <PanelLeftIcon />
          </button>
        ) : null}
      </div>

      <Link href="/" className={styles.newPlan} onClick={startNewPlan}>
        <PlusIcon />
        <span className={labelClass}>New plan</span>
      </Link>

      <nav aria-label="Primary" className={styles.nav}>
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
                <span className={labelClass}>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.bottom}>
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
