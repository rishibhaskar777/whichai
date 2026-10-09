"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Viewer } from "@/lib/auth/get-session";
import { getInitials } from "@/lib/auth/initials";
import styles from "./SidebarContent.module.css";

interface AccountMenuProps {
  viewer: Viewer;
  collapsed: boolean;
}

export function AccountMenu({ viewer, collapsed }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

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
      {open ? (
        <div id={menuId} className={styles.menu}>
          <form method="post" action="/api/auth/sign-out">
            <input type="hidden" name="csrf" value={viewer.signOutToken} />
            <button type="submit" className={styles.menuItem}>
              Sign out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
