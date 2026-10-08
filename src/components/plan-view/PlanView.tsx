"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CopyButton } from "@/components/copy-button/CopyButton";
import type { Level, Plan } from "@/lib/schemas/plan";
import controls from "@/styles/controls.module.css";
import { AccuracyCard, type Budget } from "./AccuracyCard";
import { JobCard } from "./JobCard";
import { LEVEL_LABELS, LevelSwitch } from "./LevelSwitch";
import {
  BulletSection,
  CheckTheFacts,
  Overview,
  StarterBrief,
  TierBlock,
  Workflow,
} from "./PlanSections";
import styles from "./PlanView.module.css";

interface PlanViewProps {
  plan: Plan;
  initialLevel: Level;
}

export function PlanView({ plan, initialLevel }: PlanViewProps) {
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const jobsTitleId = useId();
  const laterNoteId = useId();
  const [level, setLevel] = useState<Level>(initialLevel);
  const [levelNotice, setLevelNotice] = useState("");
  const [usedTools, setUsedTools] = useState<ReadonlySet<string>>(new Set());
  const [budget, setBudget] = useState<Budget | null>(null);

  useEffect(() => {
    headlineRef.current?.focus();
  }, []);

  const content = plan.levels[level];
  const toolNames = useMemo(
    () => [...new Set(content.jobs.map((job) => job.toolName))],
    [content],
  );

  function changeLevel(next: Level) {
    setLevel(next);
    setLevelNotice(`Showing the ${LEVEL_LABELS[next]} level.`);
  }

  function toggleTool(toolName: string) {
    setUsedTools((current) => {
      const next = new Set(current);
      if (!next.delete(toolName)) next.add(toolName);
      return next;
    });
  }

  return (
    <article className={styles.plan} aria-labelledby="plan-headline">
      <p className={styles.notice}>
        <strong>Sample plan:</strong> tools, prices and dates are examples and
        not verified.
      </p>

      <h2
        id="plan-headline"
        ref={headlineRef}
        tabIndex={-1}
        className={styles.headline}
      >
        {plan.headline}
      </h2>

      <LevelSwitch level={level} onChange={changeLevel} />
      <p role="status" className={controls.srOnly}>
        {levelNotice}
      </p>

      <div key={level} className={styles.body}>
        <Overview level={content} />

        <section className={styles.section} aria-labelledby={jobsTitleId}>
          <h3 id={jobsTitleId} className={styles.sectionTitle}>
            What to use
          </h3>
          <ul className={styles.jobs}>
            {content.jobs.map((job) => (
              <li key={job.jobName}>
                <JobCard
                  job={job}
                  tag={usedTools.has(job.toolName) ? "keep" : job.tag}
                  alternatives={
                    budget === "zero"
                      ? job.alternatives.filter((option) => !option.paidOnly)
                      : job.alternatives
                  }
                />
              </li>
            ))}
          </ul>
        </section>

        {content.tiers ? <TierBlock tiers={content.tiers} /> : null}
        <Workflow steps={content.workflow} />
        <StarterBrief brief={content.starterBrief} />
        {content.checkTheFacts ? (
          <CheckTheFacts text={content.checkTheFacts} />
        ) : null}
        <BulletSection title="When to upgrade" items={content.whenToUpgrade} />
        <BulletSection title="Common mistakes" items={content.commonMistakes} />
      </div>

      <p className={styles.footer}>
        Prices and limits change. Check the official page before paying.
      </p>

      <div className={styles.actions}>
        <CopyButton
          text={content.starterBrief}
          label="Copy starter brief"
          variant="primary"
        />
        <button
          type="button"
          className={controls.button}
          disabled
          aria-describedby={laterNoteId}
        >
          Save
        </button>
        <button
          type="button"
          className={controls.button}
          disabled
          aria-describedby={laterNoteId}
        >
          Download PDF
        </button>
        <button
          type="button"
          className={controls.button}
          disabled
          aria-describedby={laterNoteId}
        >
          Share
        </button>
      </div>
      <p id={laterNoteId} className={styles.laterNote}>
        Save, Download PDF and Share arrive in a later release.
      </p>

      <AccuracyCard
        tools={toolNames}
        usedTools={usedTools}
        onToggleTool={toggleTool}
        budget={budget}
        onBudgetChange={setBudget}
      />
    </article>
  );
}
