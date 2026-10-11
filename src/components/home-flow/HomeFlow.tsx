"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { GoalForm } from "@/components/goal-form/GoalForm";
import { NoMatchCard } from "@/components/no-match-card/NoMatchCard";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { UnderstandingCard } from "@/components/understanding-card/UnderstandingCard";
import {
  pushHomeStep,
  readHomeStep,
  replaceHomeStep,
  type HomeStep,
} from "@/lib/plan/home-history";
import { loadInterpreter, type Interpreter } from "@/lib/plan/load-interpreter";
import { readSessionGoal, writeSessionGoal } from "@/lib/plan/session-goal";
import { useI18n } from "@/lib/i18n/provider";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import type { Chip, UnderstoodGoal } from "@/lib/schemas/plan";
import type { PlanRequest } from "@/lib/schemas/plan-request";
import controls from "@/styles/controls.module.css";
import styles from "./HomeFlow.module.css";

/* The plan view carries the rules engine and the catalogue, so it loads on demand. */
const PlanView = dynamic(
  () => import("@/components/plan-view/PlanView").then((m) => m.PlanView),
  { loading: () => <p role="status">…</p> },
);

type Stage =
  | { kind: "empty" }
  | { kind: "understanding"; goal: UnderstoodGoal }
  | { kind: "no-match" }
  | { kind: "editing" }
  | { kind: "plan"; request: PlanRequest; key: number };

/** The request that stands for the understanding step in the address. */
function understandingRequest(goal: UnderstoodGoal): PlanRequest {
  return {
    goal,
    level: goal.inferredLevel,
    budget: null,
    toolsUsed: [],
    chosenTools: {},
  };
}

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
  const handledGoalToken = useRef(0);
  const [interpreter, setInterpreter] = useState<Interpreter | null>(null);
  const mountedNewPlanCount = useRef(newPlanCount);
  const navigation = useRef({ token: 0, planKey: 0 });

  if (handledNewPlan !== newPlanCount) {
    setHandledNewPlan(newPlanCount);
    setStage({ kind: "empty" });
    setSubmittedGoal("");
    setDraft("");
  }

  useEffect(() => {
    if (newPlanCount > 0) inputRef.current?.focus();
    if (newPlanCount === mountedNewPlanCount.current) return;
    navigation.current.token += 1;
    const current = readHomeStep(window.location.hash, window.history.state);
    if (current.step !== "home") pushHomeStep({ step: "home" });
  }, [newPlanCount]);

  const planStage = useCallback((request: PlanRequest): Stage => {
    navigation.current.planKey += 1;
    return { kind: "plan", request, key: navigation.current.planKey };
  }, []);

  /** Shows the step a history entry stands for. Used on load, Back and Forward. */
  const showStep = useCallback(
    async (target: HomeStep) => {
      const token = (navigation.current.token += 1);
      const goalText = readSessionGoal();
      setSubmittedGoal(goalText);

      if (target.step === "home") {
        setStage({ kind: "empty" });
        setDraft(goalText);
        return;
      }
      if (target.step === "plan") {
        setStage(planStage(target.request));
        return;
      }
      const loaded = await loadInterpreter();
      if (token !== navigation.current.token) return;
      setInterpreter(loaded);
      setStage(
        target.step === "no-match"
          ? { kind: "no-match" }
          : { kind: "understanding", goal: target.request.goal },
      );
    },
    [planStage],
  );

  useEffect(() => {
    const show = () =>
      void showStep(readHomeStep(window.location.hash, window.history.state));
    show();
    window.addEventListener("popstate", show);
    return () => window.removeEventListener("popstate", show);
  }, [showStep]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (stage.kind !== "editing" || !textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, [stage.kind]);

  async function showGoal(goalText: string) {
    const loaded = await loadInterpreter();
    const goal = loaded.interpretGoal(goalText);
    navigation.current.token += 1;
    writeSessionGoal(goalText);
    setInterpreter(loaded);
    setSubmittedGoal(goalText);
    setDraft("");
    if (goal) {
      pushHomeStep({
        step: "understanding",
        request: understandingRequest(goal),
      });
      setStage({ kind: "understanding", goal });
    } else {
      pushHomeStep({ step: "no-match" });
      setStage({ kind: "no-match" });
    }
    return goal;
  }

  function submitGoal(goalText: string) {
    void showGoal(goalText).then((goal) =>
      recordGoal(goalText, goal?.goalType ?? null),
    );
  }

  // A goal re-run from the Searches page arrives through the signal, not the URL.
  useEffect(() => {
    if (!pendingGoal || pendingGoal.token === handledGoalToken.current) return;
    handledGoalToken.current = pendingGoal.token;
    consumeGoal();
    void showGoal(pendingGoal.text).then((goal) =>
      recordGoal(pendingGoal.text, goal?.goalType ?? null),
    );
  }, [pendingGoal, consumeGoal, recordGoal]);

  function updateChips(update: (chips: readonly Chip[]) => Chip[]) {
    if (stage.kind !== "understanding") return;
    const goal = { ...stage.goal, chips: update(stage.goal.chips) };
    replaceHomeStep({
      step: "understanding",
      request: understandingRequest(goal),
    });
    setStage({ kind: "understanding", goal });
  }

  function confirm() {
    if (stage.kind !== "understanding" || !interpreter) return;
    const goal = {
      ...stage.goal,
      inferredLevel: interpreter.inferLevel(stage.goal.chips),
    };
    const request: PlanRequest = {
      goal,
      level:
        settings.defaultLevel === "auto"
          ? goal.inferredLevel
          : settings.defaultLevel,
      budget: settings.defaultBudget,
      toolsUsed: [],
      chosenTools: {},
    };
    pushHomeStep({ step: "plan", request });
    setStage(planStage(request));
  }

  const keepPlanInAddress = useCallback(
    (request: PlanRequest) => replaceHomeStep({ step: "plan", request }),
    [],
  );

  function edit() {
    setDraft(submittedGoal);
    setStage({ kind: "editing" });
  }

  const started = stage.kind !== "empty";
  const showsGoalEcho =
    started && stage.kind !== "editing" && submittedGoal !== "";

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

        {stage.kind === "understanding" && interpreter ? (
          <UnderstandingCard
            chips={stage.goal.chips}
            options={interpreter.addableChips(stage.goal.goalType)}
            onRemoveChip={(id) =>
              updateChips((chips) => chips.filter((chip) => chip.id !== id))
            }
            onAddChip={(chip) => updateChips((chips) => [...chips, chip])}
            onEdit={edit}
            onConfirm={confirm}
          />
        ) : null}

        {stage.kind === "no-match" && interpreter ? (
          <NoMatchCard goals={interpreter.coveredGoals} onChoose={submitGoal} />
        ) : null}

        {stage.kind === "plan" ? (
          <PlanView
            key={stage.key}
            goal={stage.request.goal}
            initialLevel={stage.request.level}
            initialBudget={stage.request.budget}
            initialToolsUsed={stage.request.toolsUsed}
            initialChosenTools={stage.request.chosenTools}
            onRequestChange={keepPlanInAddress}
          />
        ) : null}
      </div>

      <div
        className={styles.dock}
        data-print-hide=""
        onFocusCapture={() => void loadInterpreter()}
      >
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
