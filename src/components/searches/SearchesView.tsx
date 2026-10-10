"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { RefreshIcon, TrashIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { StorageNotice } from "@/components/local-data/StorageNotice";
import { GOAL_TITLES } from "@/data/catalogue/goal-titles";
import { useI18n } from "@/lib/i18n/provider";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import { groupHistory, type HistoryGroupId } from "@/lib/storage/operations";
import type { HistoryEntry } from "@/lib/storage/schemas";
import controls from "@/styles/controls.module.css";
import styles from "./Searches.module.css";

function goalTitle(goalType: string): string {
  return GOAL_TITLES[goalType as keyof typeof GOAL_TITLES] ?? goalType;
}

const GROUP_KEYS = {
  today: "searches.group.today",
  yesterday: "searches.group.yesterday",
  week: "searches.group.week",
  older: "searches.group.older",
} as const satisfies Record<HistoryGroupId, string>;

export function SearchesView() {
  const { t, tn, formatDate } = useI18n();
  const { history, status, settings, deleteHistoryEntry, clearHistory } =
    useLocalData();
  const { startGoal } = useNewPlanSignal();
  const router = useRouter();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const titleId = useId();

  const groups = useMemo(() => groupHistory(history), [history]);

  function rerun(entry: HistoryEntry) {
    startGoal(entry.goal);
    router.push("/");
  }

  return (
    <section className={styles.page} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div>
          <h1 id={titleId} className={styles.pageTitle}>
            {t("nav.searches")}
          </h1>
          {status === "ready" ? (
            <p className={styles.count}>
              {tn("searches.count", history.length)}
            </p>
          ) : null}
        </div>
        {history.length > 0 ? (
          <button
            type="button"
            className={controls.button}
            onClick={() => setConfirmingClear(true)}
          >
            <TrashIcon width="16" height="16" />
            {t("searches.clearAll")}
          </button>
        ) : null}
      </header>

      <StorageNotice />

      {status === "ready" && !settings.saveHistory ? (
        <p role="note" className={styles.note}>
          {t("searches.off")}{" "}
          <Link href="/settings">{t("searches.openSettings")}</Link>
        </p>
      ) : null}

      {status === "loading" ? null : groups.length === 0 ? (
        <div className={styles.empty}>
          <h2 className={styles.emptyTitle}>{t("searches.empty.title")}</h2>
          <p>{t("searches.empty.text")}</p>
          <Link href="/" className={`${controls.button} ${controls.primary}`}>
            {t("plan.makeOne")}
          </Link>
        </div>
      ) : (
        groups.map((group) => (
          <section
            key={group.id}
            className={styles.group}
            aria-labelledby={`${titleId}-${group.id}`}
          >
            <h2 id={`${titleId}-${group.id}`} className={styles.groupTitle}>
              {t(GROUP_KEYS[group.id])}
            </h2>
            <ul className={styles.list}>
              {group.entries.map((entry) => (
                <li key={entry.id} className={styles.row}>
                  <div className={styles.text}>
                    <p className={styles.goal}>{entry.goal}</p>
                    <p className={styles.meta}>
                      {entry.goalType ? (
                        <span>{goalTitle(entry.goalType)}</span>
                      ) : (
                        <span>{t("searches.noMatch")}</span>
                      )}
                      <span>
                        {formatDate(
                          entry.createdAt,
                          group.id === "today" || group.id === "yesterday"
                            ? "time"
                            : "short",
                        )}
                      </span>
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={controls.button}
                      aria-label={t("searches.rerun", { goal: entry.goal })}
                      onClick={() => rerun(entry)}
                    >
                      <RefreshIcon width="16" height="16" />
                      {t("searches.rerunShort")}
                    </button>
                    <button
                      type="button"
                      className={styles.iconAction}
                      aria-label={t("searches.delete", { goal: entry.goal })}
                      onClick={() => void deleteHistoryEntry(entry.id)}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <ConfirmDialog
        open={confirmingClear}
        title={t("searches.clearTitle")}
        description={t("searches.clearText")}
        confirmLabel={t("searches.clearConfirm")}
        danger
        onCancel={() => setConfirmingClear(false)}
        onConfirm={() => {
          setConfirmingClear(false);
          void clearHistory();
        }}
      />
    </section>
  );
}
