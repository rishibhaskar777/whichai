"use client";

import { useEffect, useRef, useState } from "react";
import { GoalForm } from "@/components/goal-form/GoalForm";
import { NoMatchCard } from "@/components/no-match-card/NoMatchCard";
import { PlanView } from "@/components/plan-view/PlanView";
import { UnderstandingCard } from "@/components/understanding-card/UnderstandingCard";
import { getSamplePlan } from "@/data/sample/plans";
import {
  coveredGoals,
  inferLevel,
  interpretGoal,
} from "@/lib/plan/interpret-goal";
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

const ANNOUNCEMENTS: Record<Stage["kind"], string> = {
  empty: "",
  editing: "",
  understanding: "Goal understood. Check the details and confirm.",
  "no-match": "No plan for this goal yet. Pick a goal we cover.",
  plan: "Plan ready",
};

export function HomeFlow() {
  const [stage, setStage] = useState<Stage>({ kind: "empty" });
  const [submittedGoal, setSubmittedGoal] = useState("");
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { count: newPlanCount } = useNewPlanSignal();
  const [handledNewPlan, setHandledNewPlan] = useState(newPlanCount);

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

  function submitGoal(goalText: string) {
    const goal = interpretGoal(goalText);
    setSubmittedGoal(goalText);
    setDraft("");
    setStage(goal ? { kind: "understanding", goal } : { kind: "no-match" });
  }

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
            <p className={styles.greeting}>What do you want to do with AI?</p>
          ) : (
            <h1 className={styles.greeting}>What do you want to do with AI?</h1>
          )}
          <p className={styles.lead}>
            Describe your goal. WhichAI suggests which AI tools to use and how
            to use them, at three levels: Simple, Polished and Advanced.
          </p>
        </div>
      </div>

      <div className={styles.thread}>
        {stage.kind === "editing" ? (
          <h1 className={controls.srOnly}>Edit your goal</h1>
        ) : null}
        {showsGoalEcho ? (
          <p className={styles.goalEcho}>
            <span className={controls.srOnly}>Your goal: </span>
            {submittedGoal}
          </p>
        ) : null}

        {stage.kind === "understanding" ? (
          <UnderstandingCard
            chips={stage.goal.chips}
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
            plan={getSamplePlan(stage.goal.goalType)}
            initialLevel={stage.goal.inferredLevel}
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
        {ANNOUNCEMENTS[stage.kind]}
      </p>
    </div>
  );
}
