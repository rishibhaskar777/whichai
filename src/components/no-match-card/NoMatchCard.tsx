"use client";

import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { CoveredGoal } from "@/lib/plan/interpret-goal";
import { GOAL_GROUPS } from "@/lib/schemas/catalogue";
import controls from "@/styles/controls.module.css";
import styles from "./NoMatchCard.module.css";

interface NoMatchCardProps {
  goals: readonly CoveredGoal[];
  onChoose: (example: string) => void;
}

/** Every word typed must appear in the goal's title, example or keywords. */
export function filterGoals(
  goals: readonly CoveredGoal[],
  query: string,
): CoveredGoal[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...goals];
  return goals.filter((goal) =>
    words.every((word) => goal.searchText.includes(word)),
  );
}

export function NoMatchCard({ goals, onChoose }: NoMatchCardProps) {
  const { t, tn } = useI18n();
  const titleId = useId();
  const searchId = useId();
  const allId = useId();
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const searching = query.trim() !== "";
  const matches = filterGoals(goals, query);
  const common = goals.filter((goal) => goal.common);

  function chip(goal: CoveredGoal) {
    return (
      <li key={goal.goalType}>
        <button
          type="button"
          className={`${controls.button} ${styles.goal}`}
          onClick={() => onChoose(goal.example)}
        >
          {goal.title}
        </button>
      </li>
    );
  }

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h1 id={titleId} className={styles.title}>
        {t("noMatch.title")}
      </h1>
      <p className={styles.text}>{t("noMatch.text")}</p>

      <ul className={styles.goals} aria-label={t("noMatch.goals")}>
        {common.map(chip)}
      </ul>

      <div className={styles.search}>
        <label htmlFor={searchId}>{t("noMatch.search")}</label>
        <input
          id={searchId}
          type="search"
          className={styles.input}
          value={query}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {searching ? (
        <div className={styles.results}>
          <p role="status" className={styles.count}>
            {matches.length === 0
              ? t("noMatch.noResults")
              : tn("noMatch.results", matches.length)}
          </p>
          <ul className={styles.goals} aria-label={t("noMatch.searchResults")}>
            {matches.map(chip)}
          </ul>
        </div>
      ) : (
        <>
          <button
            type="button"
            className={styles.seeAll}
            aria-expanded={showAll}
            aria-controls={allId}
            onClick={() => setShowAll((current) => !current)}
          >
            {showAll ? t("noMatch.hideAll") : t("noMatch.seeAll")}
          </button>
          <div id={allId} hidden={!showAll} className={styles.groups}>
            {GOAL_GROUPS.map((group) => {
              const inGroup = goals.filter((goal) => goal.group === group);
              if (inGroup.length === 0) return null;
              return (
                <section key={group} className={styles.group}>
                  <h2 className={styles.groupTitle}>
                    {t(`goalGroup.${group}`)}
                  </h2>
                  <ul className={styles.goals}>{inGroup.map(chip)}</ul>
                </section>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
