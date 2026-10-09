"use client";

import { useEffect, useRef, useState } from "react";
import { GoalForm } from "@/components/goal-form/GoalForm";
import { NoMatchCard } from "@/components/no-match-card/NoMatchCard";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { PlanView } from "@/components/plan-view/PlanView";
import { UnderstandingCard } from "@/components/understanding-card/UnderstandingCard";
import {
  addableChips,
  coveredGoals,
  inferLevel,
  interpretGoal,
} from "@/lib/plan/interpret-goal";
import { useI18n } from "@/lib/i18n/provider";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import type { Chip, UnderstoodGoal } from "@/lib/schemas/plan";
import controls from "@/styles/controls.module.css";
import styles from "./HomeFlow.module.css";

type Stage =
  | { kind: "empty" }
  | { kind: "understanding"; goal: UnderstoodGoal }
  | { kind: "no-match" }
  | { kind: "editing" }
  | { kind: "plan"; goal: UnderstoodGoal };

const ANNOUNCEMENT_KEYS = {
  understanding: "home.announce.understanding",
  "no-match": "home.announce.noMatch",
  plan: "home.announce.plan",
} as const;

export function HomeFlow() {
  const { t, locale } = useI18n();
  const { settings, recordGoal } = useLocalData();
  const [stage, setStage] = useState<Stage>({ kind: "empty" });
  const [submittedGoal, setSubmittedGoal] = useState("");
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { count: newPlanCount, pendingGoal, consumeGoal } = useNewPlanSignal();
  const [handledNewPlan, setHandledNewPlan] = useState(newPlanCount);
  const [handledGoalToken, setHandledGoalToken] = useState(0);

  if (handledNewPlan !== newPlanCount) {
    setHandledNewPlan(newPlanCount);
    setStage({ kind: "empty" });
    setSubmittedGoal("");
    setDraft("");
  }

  useEffect(() => {
    if (newPlanCount > 0) inputRef.current?.focus();
  }, [newPlanCount]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (stage.kind !== "editing" || !textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [stage.kind]);

  function showGoal(goalText: string) {
    const goal = interpretGoal(goalText);
    setSubmittedGoal(goalText);
    setDraft("");
    setStage(goal ? { kind: "understanding", goal } : { kind: "no-match" });
    return goal;
  }

  function submitGoal(goalText: string) {
    const goal = showGoal(goalText);
    void recordGoal(goalText, goal?.goalType ?? null);
  }

  // A goal re-run from the Searches page arrives through the signal, not the URL.
  if (pendingGoal && pendingGoal.token !== handledGoalToken) {
    setHandledGoalToken(pendingGoal.token);
    showGoal(pendingGoal.text);
  }
  useEffect(() => {
    if (!pendingGoal) return;
    void recordGoal(
      pendingGoal.text,
      interpretGoal(pendingGoal.text)?.goalType ?? null,
    );
    consumeGoal();
  }, [pendingGoal, consumeGoal, recordGoal]);

  function updateChips(update: (chips: readonly Chip[]) => Chip[]) {
    setStage((current) =>
      current.kind === "understanding"
        ? {
            kind: "understanding",
            goal: { ...current.goal, chips: update(current.goal.chips) },
          }
        : current,
    );
  }

  function confirm() {
    if (stage.kind !== "understanding") return;
    const { goal } = stage;
    setStage({
      kind: "plan",
      goal: { ...goal, inferredLevel: inferLevel(goal.chips) },
    });
  }

  function edit() {
    setDraft(submittedGoal);
    setStage({ kind: "editing" });
  }

  const started = stage.kind !== "empty";
  const showsGoalEcho = started && stage.kind !== "editing";

  return (
    <div className={styles.home} data-mode={started ? "chat" : "empty"}>
      <div className={styles.spacer} aria-hidden="true" />

      <div className={styles.intro} data-collapsed={started}>
        <div className={styles.introInner}>
          {started ? (
            <p className={styles.greeting}>{t("home.greeting")}</p>
          ) : (
            <h1 className={styles.greeting}>{t("home.greeting")}</h1>
          )}
          <p className={styles.lead}>{t("home.lead")}</p>
          {locale === "hi" ? (
            <p className={styles.lead}>{t("home.englishOnly")}</p>
          ) : null}
        </div>
      </div>

      <div className={styles.thread}>
        {stage.kind === "editing" ? (
          <h1 className={controls.srOnly}>{t("home.editGoal")}</h1>
        ) : null}
        {showsGoalEcho ? (
          <p className={styles.goalEcho}>
            <span className={controls.srOnly}>{t("home.yourGoal")}</span>
            {submittedGoal}
          </p>
        ) : null}

        {stage.kind === "understanding" ? (
          <UnderstandingCard
            chips={stage.goal.chips}
            options={addableChips(stage.goal.goalType)}
            onRemoveChip={(id) =>
              updateChips((chips) => chips.filter((chip) => chip.id !== id))
            }
            onAddChip={(chip) => updateChips((chips) => [...chips, chip])}
            onEdit={edit}
            onConfirm={confirm}
          />
        ) : null}

        {stage.kind === "no-match" ? (
          <NoMatchCard goals={coveredGoals} onChoose={submitGoal} />
        ) : null}

        {stage.kind === "plan" ? (
          <PlanView
            goal={stage.goal}
            initialLevel={
              settings.defaultLevel === "auto"
                ? stage.goal.inferredLevel
                : settings.defaultLevel
            }
            initialBudget={settings.defaultBudget}
          />
        ) : null}
      </div>

      <div className={styles.dock}>
        <GoalForm
          value={draft}
          onValueChange={setDraft}
          onSubmit={submitGoal}
          inputRef={inputRef}
          compact={started}
        />
      </div>

      <div className={styles.spacer} aria-hidden="true" />

      <p role="status" className={controls.srOnly}>
        {stage.kind in ANNOUNCEMENT_KEYS
          ? t(ANNOUNCEMENT_KEYS[stage.kind as keyof typeof ANNOUNCEMENT_KEYS])
          : ""}
      </p>
    </div>
  );
}
