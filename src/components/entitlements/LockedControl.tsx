"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { LockIcon } from "@/components/icons";
import { useSignIn } from "@/components/sign-in/SignInProvider";
import { useI18n } from "@/lib/i18n/provider";
import type { Requirement } from "@/lib/plans/entitlements";
import styles from "./LockedControl.module.css";

interface LockedControlProps {
  /** What unlocks the feature. A paid plan goes to /pricing, an account to Register. */
  requirement: Exclude<Requirement, "none">;
  className?: string | undefined;
  children: ReactNode;
}

/*
 * Stands in for a control the person cannot use yet. It looks like the
 * control, carries a lock, and leads to where the feature is unlocked, so a
 * locked feature is never a dead end. The tip appears on hover and focus and
 * is also the control's description.
 */
export function LockedControl({
  requirement,
  className,
  children,
}: LockedControlProps) {
  const { t } = useI18n();
  const { open } = useSignIn();
  const tipId = useId();
  const classes = [styles.locked, className].filter(Boolean).join(" ");
  const tip = (
    <span id={tipId} role="tooltip" className={styles.tip}>
      {requirement === "paid"
        ? t("limits.locked.paid")
        : t("limits.locked.account")}
    </span>
  );
  const content = (
    <>
      <LockIcon className={styles.icon} width="16" height="16" />
      {children}
      {tip}
    </>
  );

  if (requirement === "paid") {
    return (
      <Link
        href="/pricing"
        className={classes}
        aria-describedby={tipId}
        prefetch={false}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={classes}
      aria-describedby={tipId}
      aria-haspopup="dialog"
      onClick={(event) => open(event.currentTarget, "register")}
    >
      {content}
    </button>
  );
}
