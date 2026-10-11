"use client";

import Link from "next/link";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import type { Locale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";
import styles from "./SidebarContent.module.css";

const ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"]';
const MENU_GAP = 8;
const RAIL_MENU_WIDTH = 240;

/** Marks the element a menu lines up with when the sidebar is expanded. */
export const MENU_ANCHOR_ATTRIBUTE = "data-menu-anchor";

export interface MenuTriggerProps {
  ref: RefObject<HTMLButtonElement | null>;
  open: boolean;
  menuId: string;
  onClick: () => void;
}

interface PopoverMenuProps {
  label: string;
  collapsed: boolean;
  /** Let the trigger take the remaining width of the row. */
  grow?: boolean;
  onNavigate?: (() => void) | undefined;
  trigger: (props: MenuTriggerProps) => ReactNode;
  /** Receives a function that closes the menu and the mobile drawer. */
  children: (closeAfterNavigate: () => void) => ReactNode;
}

/**
 * A menu button with a popover above (or beside, on the rail) the sidebar
 * footer. Escape closes it and returns focus, arrows, Home and End move, and
 * the popover is placed against the viewport because the sidebar clips.
 */
export function PopoverMenu({
  label,
  collapsed,
  grow = false,
  onNavigate,
  trigger,
  children,
}: PopoverMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const closeAndReturnFocus = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };
  const closeAfterNavigate = () => {
    setOpen(false);
    onNavigate?.();
  };

  useLayoutEffect(() => {
    const menu = menuRef.current;
    const button = buttonRef.current;
    if (!open || !menu || !button) return;
    const buttonRect = button.getBoundingClientRect();
    const anchor = button.closest(`[${MENU_ANCHOR_ATTRIBUTE}]`) ?? button;
    const rect = collapsed ? buttonRect : anchor.getBoundingClientRect();
    const left = collapsed ? rect.right + MENU_GAP : rect.left;
    const bottom = collapsed
      ? window.innerHeight - rect.bottom
      : window.innerHeight - rect.top + MENU_GAP;
    menu.style.setProperty("left", `${left}px`);
    menu.style.setProperty("bottom", `${bottom}px`);
    menu.style.setProperty(
      "width",
      `${collapsed ? RAIL_MENU_WIDTH : rect.width}px`,
    );
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
    <div ref={rootRef} className={grow ? styles.menuRootGrow : styles.menuRoot}>
      {trigger({
        ref: buttonRef,
        open,
        menuId,
        onClick: () => setOpen((current) => !current),
      })}
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={label}
          className={styles.menu}
          onKeyDown={onMenuKeyDown}
        >
          {children(closeAfterNavigate)}
        </div>
      ) : null}
    </div>
  );
}

export function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={styles.menuItem}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

export function MenuDivider() {
  return <div className={styles.menuDivider} role="separator" />;
}

const LANGUAGES: readonly { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "हिन्दी" },
];

export function LanguageGroup() {
  const { t, locale } = useI18n();
  const { updateSettings } = useLocalData();
  const labelId = useId();
  return (
    <>
      <p id={labelId} className={styles.menuLabel}>
        {t("settings.language")}
      </p>
      <div role="group" aria-labelledby={labelId}>
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
    </>
  );
}
