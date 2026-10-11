"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GoalForm } from "@/components/goal-form/GoalForm";
import { NoMatchCard } from "@/components/no-match-card/NoMatchCard";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { UnderstandingCard } from "@/components/understanding-card/UnderstandingCard";
import {
  pushHomeStep,
  readHomeGoal,
  readHomeStep,
  rememberHomeGoal,
  replaceHomeStep,
  startFreshHomeVisit,
  type HomeStep,
} from "@/lib/plan/home-history";
import type { GoalSuggestion, Understanding } from "@/lib/plan/interpret-goal";
import { loadInterpreter, type Interpreter } from "@/lib/plan/load-interpreter";
import { useI18n } from "@/lib/i18n/provider";
import { useNewPlanSignal } from "@/lib/new-plan-signal";
import { CUSTOM_GOAL_ID } from "@/lib/schemas/catalogue";
import type { Chip, UnderstoodGoal } from "@/lib/schemas/plan";
import type { PlanRequest } from "@/lib/schemas/plan-request";
import controls from "@/styles/controls.module.css";
import styles from "./HomeFlow.module.css";

/* The plan view carries the rules engine and the catalogue, so it loads on demand. */
const PlanView = dynamic(
  () => import("@/components/plan-view/PlanView").then((m) => m.PlanView),
  { loading: () => <p role="status">…</p> },
);

/** What is on offer when the sentence did not point to one goal. */
interface Doubt {
  suggestions: GoalSuggestion[];
  partsGoal: UnderstoodGoal | null;
}

type Stage =
  | { kind: "empty" }
  | { kind: "understanding"; goal: UnderstoodGoal; doubt: Doubt | null }
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
    addedJobs: [],
    removedJobs: [],
  };
}

function doubtOf(understanding: Understanding | null): Doubt | null {
  if (!understanding || understanding.confidence === "high") return null;
  return {
    suggestions: understanding.suggestions,
    partsGoal: understanding.partsGoal,
  };
}

const ANNOUNCEMENT_KEYS = {
  understanding: "home.announce.understanding",
  "no-match": "home.announce.noMatch",
  plan: "home.announce.plan",
} as const;

export function HomeFlow() {
  const { t, locale } = useI18n();
  const { settings, recordGoal, recordMiss } = useLocalData();
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
    if (current.step === "home") replaceHomeStep(current, "");
    else pushHomeStep({ step: "home" }, "");
  }, [newPlanCount]);

  const planStage = useCallback((request: PlanRequest): Stage => {
    navigation.current.planKey += 1;
    return { kind: "plan", request, key: navigation.current.planKey };
  }, []);

  /** Shows the step a history entry stands for. Used on load, Back and Forward. */
  const showStep = useCallback(
    async (target: HomeStep) => {
      const token = (navigation.current.token += 1);
      const goalText = readHomeGoal(window.history.state);
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
          : {
              kind: "understanding",
              goal: target.request.goal,
              doubt: doubtOf(loaded.understandGoal(goalText)),
            },
      );
    },
    [planStage],
  );

  useEffect(() => {
    const show = () =>
      void showStep(readHomeStep(window.location.hash, window.history.state));
    if (startFreshHomeVisit() && inputRef.current) {
      // The browser can put back the text of a reloaded page before React runs.
      inputRef.current.value = "";
    }
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
    const understanding = loaded.understandGoal(goalText);
    const goal = understanding?.goal ?? null;
    navigation.current.token += 1;
    rememberHomeGoal(goalText);
    setInterpreter(loaded);
    setSubmittedGoal(goalText);
    setDraft("");
    if (goal) {
      pushHomeStep(
        { step: "understanding", request: understandingRequest(goal) },
        goalText,
      );
      setStage({
        kind: "understanding",
        goal,
        doubt: doubtOf(understanding),
      });
    } else {
      pushHomeStep({ step: "no-match" }, goalText);
      setStage({ kind: "no-match" });
    }
    return understanding;
  }

  /** Remembers, on this device only, a goal that no template matched well. */
  const noteMiss = useCallback(
    (goalText: string, understanding: Understanding | null) => {
      if (!understanding) return void recordMiss(goalText, "no-match");
      if (understanding.goal.goalType === CUSTOM_GOAL_ID) {
        return void recordMiss(goalText, "parts-only");
      }
      if (understanding.confidence === "low") {
        void recordMiss(goalText, "unsure");
      }
    },
    [recordMiss],
  );

  function submitGoal(goalText: string) {
    void showGoal(goalText).then((understanding) => {
      void recordGoal(goalText, understanding?.goal.goalType ?? null);
      noteMiss(goalText, understanding);
    });
  }

  // A goal re-run from the Searches page arrives through the signal, not the URL.
  useEffect(() => {
    if (!pendingGoal || pendingGoal.token === handledGoalToken.current) return;
    handledGoalToken.current = pendingGoal.token;
    consumeGoal();
    void showGoal(pendingGoal.text).then((understanding) => {
      void recordGoal(pendingGoal.text, understanding?.goal.goalType ?? null);
      noteMiss(pendingGoal.text, understanding);
    });
  }, [pendingGoal, consumeGoal, recordGoal, noteMiss]);

  function updateChips(update: (chips: readonly Chip[]) => Chip[]) {
    if (stage.kind !== "understanding") return;
    const goal = { ...stage.goal, chips: update(stage.goal.chips) };
    replaceHomeStep({
      step: "understanding",
      request: understandingRequest(goal),
    });
    setStage({ kind: "understanding", goal, doubt: stage.doubt });
  }

  function replaceGoal(goal: UnderstoodGoal | null) {
    if (stage.kind !== "understanding" || !goal) return;
    replaceHomeStep({
      step: "understanding",
      request: understandingRequest(goal),
    });
    setStage({ kind: "understanding", goal, doubt: stage.doubt });
  }

  function chooseGoal(goalType: GoalSuggestion["goalType"]) {
    replaceGoal(interpreter?.understandAs(submittedGoal, goalType) ?? null);
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
      addedJobs: [],
      removedJobs: [],
    };
    pushHomeStep({ step: "plan", request }, submittedGoal);
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

  const parts = useMemo(() => interpreter?.listParts() ?? [], [interpreter]);
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
            parts={parts}
            suggestions={stage.doubt?.suggestions ?? []}
            onChooseGoal={chooseGoal}
            onBuildFromParts={
              stage.doubt?.partsGoal && stage.goal.goalType !== CUSTOM_GOAL_ID
                ? () => replaceGoal(stage.doubt?.partsGoal ?? null)
                : undefined
            }
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
            initialAddedJobs={stage.request.addedJobs}
            initialRemovedJobs={stage.request.removedJobs}
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
