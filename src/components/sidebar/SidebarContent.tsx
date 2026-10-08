"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type SVGProps } from "react";
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
  UserIcon,
} from "@/components/icons";
import { ThemeControl } from "@/components/theme-control/ThemeControl";
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

const SIGN_IN_NOTICE_MS = 5000;

interface SidebarContentProps {
  collapsed: boolean;
  initialTheme: ThemeChoice;
  onToggleCollapse?: () => void;
  onClose?: () => void;
}

export function SidebarContent({
  collapsed,
  initialTheme,
  onToggleCollapse,
  onClose,
}: SidebarContentProps) {
  const pathname = usePathname();
  const [signInNotice, setSignInNotice] = useState(false);

  useEffect(() => {
    if (!signInNotice) return;
    const timer = window.setTimeout(
      () => setSignInNotice(false),
      SIGN_IN_NOTICE_MS,
    );
    return () => window.clearTimeout(timer);
  }, [signInNotice]);

  const closeDrawer = () => onClose?.();
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

      <Link href="/" className={styles.newPlan} onClick={closeDrawer}>
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
        <div className={styles.signIn}>
          <button
            type="button"
            className={styles.action}
            onClick={() => setSignInNotice(true)}
          >
            <UserIcon />
            <span className={labelClass}>Sign in</span>
          </button>
          <p
            role="status"
            className={styles.notice}
            data-visible={signInNotice}
          >
            {signInNotice ? "Accounts arrive in a later release." : ""}
          </p>
        </div>
        <ThemeControl initialChoice={initialTheme} compact={collapsed} />
      </div>
    </div>
  );
}
