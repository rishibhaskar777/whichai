"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { MoreIcon } from "@/components/icons";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { usePlanActions } from "@/components/local-data/use-plan-actions";
import { useI18n } from "@/lib/i18n/provider";
import { sortPlans } from "@/lib/storage/operations";
import type { SavedPlan } from "@/lib/storage/schemas";
import styles from "./SidebarContent.module.css";

const RECENT_COUNT = 5;

interface RecentItemProps {
  plan: SavedPlan;
  onNavigate: () => void;
}

function RecentItem({ plan, onNavigate }: RecentItemProps) {
  const { t } = useI18n();
  const actions = usePlanActions();
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(plan.title);
  const rootRef = useRef<HTMLLIElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (renaming) {
    return (
      <li className={styles.recentItem}>
        <form
          className={styles.recentRename}
          onSubmit={async (event) => {
            event.preventDefault();
            if (await actions.rename(plan, draft)) setRenaming(false);
          }}
        >
          <label className={styles.srOnly} htmlFor={`${menuId}-rename`}>
            {t("projects.renameLabel")}
          </label>
          <input
            id={`${menuId}-rename`}
            className={styles.recentInput}
            value={draft}
            maxLength={80}
            autoFocus
            onChange={(event) => setDraft(event.target.value)}
            onBlur={() => setRenaming(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") setRenaming(false);
            }}
          />
        </form>
      </li>
    );
  }

  return (
    <li ref={rootRef} className={styles.recentItem}>
      <Link
        href={`/plan?id=${encodeURIComponent(plan.id)}`}
        className={styles.recentLink}
        onClick={onNavigate}
      >
        <span className={styles.recentTitle}>{plan.title}</span>
      </Link>
      <button
        ref={buttonRef}
        type="button"
        className={styles.recentMenuButton}
        aria-label={t("projects.menu", { title: plan.title })}
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        onClick={() => setMenuOpen((current) => !current)}
      >
        <MoreIcon />
      </button>
      {menuOpen ? (
        <div id={menuId} className={styles.recentMenu}>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setMenuOpen(false);
              setDraft(plan.title);
              setRenaming(true);
            }}
          >
            {t("common.rename")}
          </button>
          <button
            type="button"
            className={styles.menuItem}
            onClick={() => {
              setMenuOpen(false);
              void actions.remove(plan);
            }}
          >
            {t("common.delete")}
          </button>
        </div>
      ) : null}
    </li>
  );
}

export function RecentProjects({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useI18n();
  const { plans } = useLocalData();
  const recent = sortPlans(plans, "recent").slice(0, RECENT_COUNT);
  if (recent.length === 0) return null;

  return (
    <div className={styles.recent}>
      <ul aria-label={t("projects.recent")} className={styles.recentList}>
        {recent.map((plan) => (
          <RecentItem key={plan.id} plan={plan} onNavigate={onNavigate} />
        ))}
      </ul>
      <Link href="/projects" className={styles.viewAll} onClick={onNavigate}>
        {t("projects.viewAll")}
      </Link>
    </div>
  );
}
