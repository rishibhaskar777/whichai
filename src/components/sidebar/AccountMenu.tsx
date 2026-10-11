"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDownIcon, SettingsIcon, UserIcon } from "@/components/icons";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { useSignIn } from "@/components/sign-in/SignInProvider";
import type { Viewer } from "@/lib/auth/get-session";
import { getInitials } from "@/lib/auth/initials";
import type { MessageKey } from "@/lib/i18n/en";
import type { Locale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";
import { getCurrentPlan } from "@/lib/pricing/current-plan";
import { getPlan, localize } from "@/lib/pricing/plans";
import type { ThemeChoice } from "@/lib/theme";
import { useThemeChoice } from "./use-theme-choice";
import styles from "./SidebarContent.module.css";

interface SidebarAccountProps {
  viewer: Viewer | null;
  collapsed: boolean;
  initialTheme: ThemeChoice;
  onNavigate?: (() => void) | undefined;
}

/** The one row at the bottom of the sidebar: sign in, or the account menu. */
export function SidebarAccount({
  viewer,
  collapsed,
  initialTheme,
  onNavigate,
}: SidebarAccountProps) {
  return viewer ? (
    <AccountMenu
      viewer={viewer}
      collapsed={collapsed}
      initialTheme={initialTheme}
      onNavigate={onNavigate}
    />
  ) : (
    <GuestRow collapsed={collapsed} onNavigate={onNavigate} />
  );
}

function GuestRow({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}) {
  const { open } = useSignIn();
  const { t } = useI18n();
  return (
    <div className={styles.guestRow} data-collapsed={collapsed}>
      <button
        type="button"
        className={collapsed ? styles.iconButton : styles.signIn}
        aria-haspopup="dialog"
        aria-label={collapsed ? t("nav.signIn") : undefined}
        onClick={(event) => open(event.currentTarget)}
      >
        {collapsed ? <UserIcon /> : t("nav.signIn")}
      </button>
      <Link
        href="/settings"
        className={styles.iconButton}
        aria-label={t("nav.settings")}
        onClick={() => onNavigate?.()}
      >
        <SettingsIcon />
      </Link>
    </div>
  );
}

const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"]';

const THEMES: readonly { value: ThemeChoice; label: MessageKey }[] = [
  { value: "system", label: "theme.system" },
  { value: "light", label: "theme.light" },
  { value: "dark", label: "theme.dark" },
];

const LANGUAGES: readonly { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
];

const MENU_GAP = 8;
const RAIL_MENU_WIDTH = 240;

interface AccountMenuProps {
  viewer: Viewer;
  collapsed: boolean;
  initialTheme: ThemeChoice;
  onNavigate?: (() => void) | undefined;
}

function AccountMenu({
  viewer,
  collapsed,
  initialTheme,
  onNavigate,
}: AccountMenuProps) {
  const { t, locale } = useI18n();
  const { updateSettings } = useLocalData();
  const theme = useThemeChoice(initialTheme);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const themeLabelId = useId();
  const languageLabelId = useId();
  const plan = getPlan(getCurrentPlan());

  const closeAndReturnFocus = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };
  const closeAfterNavigate = () => {
    setOpen(false);
    onNavigate?.();
  };

  /*
   * The sidebar clips its contents, so the menu is placed against the
   * viewport (position: fixed) beside the row, through the CSSOM.
   */
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const button = buttonRef.current;
    if (!open || !menu || !button) return;
    const rect = button.getBoundingClientRect();
    const width = collapsed ? RAIL_MENU_WIDTH : rect.width;
    const left = collapsed ? rect.right + MENU_GAP : rect.left;
    const bottom = collapsed
      ? window.innerHeight - rect.bottom
      : window.innerHeight - rect.top + MENU_GAP;
    menu.style.setProperty("left", `${left}px`);
    menu.style.setProperty("bottom", `${bottom}px`);
    menu.style.setProperty("width", `${width}px`);
  }, [open, collapsed]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus();
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const onMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(ITEM_SELECTOR),
    );
    const index = items.indexOf(document.activeElement as HTMLElement);
    const move = (next: number) => {
      event.preventDefault();
      items[(next + items.length) % items.length]?.focus();
    };
    if (event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowUp") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(items.length - 1);
    else if (event.key === "Tab") {
      event.preventDefault();
      closeAndReturnFocus();
    }
  };

  return (
    <div ref={rootRef} className={styles.account}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.accountButton}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={styles.avatar} aria-hidden="true">
          {getInitials(viewer.name)}
        </span>
        <span className={collapsed ? styles.srOnly : styles.accountText}>
          <span className={styles.accountName}>{viewer.name}</span>
          <span className={styles.accountPlan}>
            {t("plan.label", { plan: localize(plan.name, locale) })}
          </span>
        </span>
        {collapsed ? null : (
          <ChevronDownIcon className={styles.chevron} aria-hidden="true" />
        )}
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t("account.menu")}
          className={styles.menu}
          onKeyDown={onMenuKeyDown}
        >
          <Link
            href="/settings"
            role="menuitem"
            className={styles.menuItem}
            onClick={closeAfterNavigate}
          >
            {t("nav.settings")}
          </Link>
          <Link
            href="/pricing"
            role="menuitem"
            className={styles.menuItem}
            onClick={closeAfterNavigate}
          >
            {t("plan.upgrade")}
          </Link>
          <Link
            href="/help"
            role="menuitem"
            className={styles.menuItem}
            onClick={closeAfterNavigate}
          >
            {t("nav.help")}
          </Link>

          <div className={styles.menuDivider} role="separator" />
          <p id={themeLabelId} className={styles.menuLabel}>
            {t("theme.label")}
          </p>
          <div role="group" aria-labelledby={themeLabelId}>
            {THEMES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={theme === value}
                className={styles.menuItem}
                onClick={() => void updateSettings({ theme: value })}
              >
                {t(label)}
              </button>
            ))}
          </div>

          <div className={styles.menuDivider} role="separator" />
          <p id={languageLabelId} className={styles.menuLabel}>
            {t("settings.language")}
          </p>
          <div role="group" aria-labelledby={languageLabelId}>
            {LANGUAGES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                role="menuitemradio"
                aria-checked={locale === value}
                lang={value}
                className={styles.menuItem}
                onClick={() => void updateSettings({ language: value })}
              >
                {label}
              </button>
            ))}
          </div>

          <div className={styles.menuDivider} role="separator" />
          <form method="post" action="/api/auth/sign-out">
            <input type="hidden" name="csrf" value={viewer.signOutToken} />
            <button type="submit" role="menuitem" className={styles.menuItem}>
              {t("nav.signOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
