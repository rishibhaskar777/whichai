"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import {
  CopyPlusIcon,
  DownloadIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { StorageNotice } from "@/components/local-data/StorageNotice";
import { usePlanActions } from "@/components/local-data/use-plan-actions";
import { GOAL_TITLES } from "@/data/catalogue/goal-titles";
import { useI18n } from "@/lib/i18n/provider";
import { downloadTextFile } from "@/lib/storage/download";
import { backupFileName, isStale, sortPlans } from "@/lib/storage/operations";
import type { SavedPlan } from "@/lib/storage/schemas";
import controls from "@/styles/controls.module.css";
import styles from "./Projects.module.css";

const LEAVE_MS = 200;

function goalTitle(goalType: string): string {
  return GOAL_TITLES[goalType as keyof typeof GOAL_TITLES] ?? goalType;
}

interface RowProps {
  plan: SavedPlan;
  renaming: boolean;
  leaving: boolean;
  onStartRename: () => void;
  onStopRename: () => void;
  onRename: (title: string) => Promise<boolean>;
  onDuplicate: () => void;
  onDelete: () => void;
}

function ProjectRow({
  plan,
  renaming,
  leaving,
  onStartRename,
  onStopRename,
  onRename,
  onDuplicate,
  onDelete,
}: RowProps) {
  const { t, formatDate } = useI18n();
  const [draft, setDraft] = useState(plan.title);
  const inputId = useId();
  const href = `/plan?id=${encodeURIComponent(plan.id)}`;

  return (
    <li className={styles.row} data-leaving={leaving}>
      <div className={styles.rowInner}>
        <div className={styles.main}>
          {renaming ? (
            <form
              className={styles.renameForm}
              onSubmit={async (event) => {
                event.preventDefault();
                if (await onRename(draft)) onStopRename();
              }}
            >
              <label htmlFor={inputId} className={controls.srOnly}>
                {t("projects.renameLabel")}
              </label>
              <input
                id={inputId}
                className={styles.renameInput}
                value={draft}
                maxLength={80}
                autoFocus
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") onStopRename();
                }}
              />
              <button type="submit" className={controls.button}>
                {t("common.save")}
              </button>
              <button
                type="button"
                className={controls.button}
                onClick={onStopRename}
              >
                {t("common.cancel")}
              </button>
            </form>
          ) : (
            <h2 className={styles.title}>
              <Link href={href}>{plan.title}</Link>
            </h2>
          )}
          <p className={styles.meta}>
            <span>{goalTitle(plan.planRequest.goal.goalType)}</span>
            <span>{t(`level.${plan.planRequest.level}`)}</span>
            <span>
              {t("projects.savedOn", { date: formatDate(plan.updatedAt) })}
            </span>
            {isStale(plan) ? (
              <span className={styles.badge} title={t("projects.updatedHint")}>
                {t("projects.updatedTools")}
              </span>
            ) : null}
          </p>
        </div>
        <div className={styles.actions}>
          <Link href={href} className={controls.button}>
            {t("projects.open")}
          </Link>
          <button
            type="button"
            className={styles.iconAction}
            aria-label={t("projects.rename", { title: plan.title })}
            onClick={onStartRename}
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            className={styles.iconAction}
            aria-label={t("projects.duplicate", { title: plan.title })}
            onClick={onDuplicate}
          >
            <CopyPlusIcon />
          </button>
          <button
            type="button"
            className={styles.iconAction}
            aria-label={t("projects.delete", { title: plan.title })}
            onClick={onDelete}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </li>
  );
}

export function ProjectsView() {
  const { t, tn } = useI18n();
  const { plans, status, exportBackup } = useLocalData();
  const actions = usePlanActions();
  const searchId = useId();
  const sortId = useId();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<ReadonlySet<string>>(new Set());

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortPlans(plans, sort).filter(
      (plan) =>
        needle === "" ||
        plan.title.toLowerCase().includes(needle) ||
        goalTitle(plan.planRequest.goal.goalType)
          .toLowerCase()
          .includes(needle),
    );
  }, [plans, query, sort]);

  // The row folds away first, then the plan is removed with an Undo toast.
  function remove(plan: SavedPlan) {
    setLeaving((current) => new Set(current).add(plan.id));
    window.setTimeout(() => {
      void actions.remove(plan).finally(() =>
        setLeaving((current) => {
          const next = new Set(current);
          next.delete(plan.id);
          return next;
        }),
      );
    }, LEAVE_MS);
  }

  return (
    <section className={styles.page} aria-labelledby="projects-title">
      <header className={styles.header}>
        <div>
          <h1 id="projects-title" className={styles.pageTitle}>
            {t("nav.projects")}
          </h1>
          {status === "ready" ? (
            <p className={styles.count}>{tn("projects.count", plans.length)}</p>
          ) : null}
        </div>
        {plans.length > 0 ? (
          <button
            type="button"
            className={controls.button}
            onClick={() => downloadTextFile(backupFileName(), exportBackup())}
          >
            <DownloadIcon width="16" height="16" />
            {t("data.export")}
          </button>
        ) : null}
      </header>

      <StorageNotice />

      {plans.length > 0 ? (
        <div className={styles.tools}>
          <div className={styles.field}>
            <label htmlFor={searchId}>{t("projects.search")}</label>
            <input
              id={searchId}
              type="search"
              className={styles.input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor={sortId}>{t("projects.sort")}</label>
            <select
              id={sortId}
              className={styles.input}
              value={sort}
              onChange={(event) =>
                setSort(event.target.value === "name" ? "name" : "recent")
              }
            >
              <option value="recent">{t("projects.sort.recent")}</option>
              <option value="name">{t("projects.sort.name")}</option>
            </select>
          </div>
        </div>
      ) : null}

      {status === "loading" ? null : plans.length === 0 ? (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>{t("projects.empty.title")}</h2>
          <p>{t("projects.empty.text")}</p>
          <Link href="/" className={`${controls.button} ${controls.primary}`}>
            {t("plan.makeOne")}
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <p role="status" className={styles.none}>
          {t("projects.noMatch")}
        </p>
      ) : (
        <ul className={styles.list}>
          {visible.map((plan) => (
            <ProjectRow
              key={plan.id}
              plan={plan}
              renaming={renamingId === plan.id}
              leaving={leaving.has(plan.id)}
              onStartRename={() => setRenamingId(plan.id)}
              onStopRename={() => setRenamingId(null)}
              onRename={(title) => actions.rename(plan, title)}
              onDuplicate={() => void actions.duplicate(plan)}
              onDelete={() => remove(plan)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
