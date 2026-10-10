"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { Viewer } from "@/lib/auth/get-session";
import { getInitials } from "@/lib/auth/initials";
import { useI18n } from "@/lib/i18n/provider";
import { PlanLink } from "./PlanLabel";
import styles from "./SidebarContent.module.css";

interface AccountMenuProps {
  viewer: Viewer;
  collapsed: boolean;
  onNavigate?: (() => void) | undefined;
}

export function AccountMenu({
  viewer,
  collapsed,
  onNavigate,
}: AccountMenuProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
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

  return (
    <div ref={rootRef} className={styles.account}>
      <div className={styles.accountRow}>
        <button
          ref={buttonRef}
          type="button"
          className={styles.action}
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((current) => !current)}
        >
          <span className={styles.avatar} aria-hidden="true">
            {getInitials(viewer.name)}
          </span>
          <span className={collapsed ? styles.srOnly : styles.accountName}>
            {viewer.name}
          </span>
        </button>
        {collapsed ? null : <PlanLink onNavigate={onNavigate} />}
      </div>
      {open ? (
        <div id={menuId} className={styles.menu}>
          <Link href="/pricing" className={styles.menuItem} onClick={close}>
            {t("plan.upgrade")}
          </Link>
          <Link
            href="/settings#subscription"
            className={styles.menuItem}
            onClick={close}
          >
            {t("plan.subscription")}
          </Link>
          <Link href="/settings" className={styles.menuItem} onClick={close}>
            {t("nav.settings")}
          </Link>
          <form method="post" action="/api/auth/sign-out">
            <input type="hidden" name="csrf" value={viewer.signOutToken} />
            <button type="submit" className={styles.menuItem}>
              {t("nav.signOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
