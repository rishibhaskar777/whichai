"use client";

import { useId, useState } from "react";
import { ChevronDownIcon, ExternalLinkIcon } from "@/components/icons";
import type { ToolKind } from "@/lib/schemas/catalogue";
import type {
  JobRecommendation,
  JobTag,
  SourceLabel,
} from "@/lib/schemas/plan";
import { useMediaQuery } from "@/lib/use-media-query";
import controls from "@/styles/controls.module.css";
import styles from "./JobCard.module.css";
import { ModelGuidance } from "./ModelGuidance";

const TAG_LABELS: Record<JobTag, string> = {
  keep: "Keep",
  better: "Better option",
  new: "New",
};

const SOURCE_LABELS: Record<SourceLabel, string> = {
  tested: "Tested",
  "official-docs": "Official docs",
  "user-reported": "User reported",
  sample: "Sample data",
};

const KIND_LABELS: Record<ToolKind, string> = {
  "ai-tool": "AI tool",
  library: "Library",
  service: "Service",
  app: "App",
  "template-source": "Template source",
};

export function jobCardId(jobId: string): string {
  return `job-card-${jobId}`;
}

export function JobCard({ job }: { job: JobRecommendation }) {
  const titleId = useId();
  const panelId = useId();
  const wideScreen = useMediaQuery("(min-width: 768px)", false);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const open = chosen ?? wideScreen;

  return (
    <article
      id={jobCardId(job.jobId)}
      tabIndex={-1}
      className={styles.card}
      aria-labelledby={titleId}
    >
      <header className={styles.header}>
        <div>
          <p className={styles.jobName}>
            {job.jobName}
            <span className={styles.kind}>{KIND_LABELS[job.kind]}</span>
          </p>
          <h3 id={titleId} className={styles.toolName}>
            {job.toolName}
          </h3>
        </div>
        <span className={styles.tag} data-tag={job.tag}>
          {TAG_LABELS[job.tag]}
        </span>
      </header>

      <p className={styles.why}>{job.why}</p>

      {job.modelGuidance ? (
        <ModelGuidance guidance={job.modelGuidance} />
      ) : null}

      <dl className={styles.facts}>
        <div>
          <dt>Pricing</dt>
          <dd>{job.pricing}</dd>
        </div>
        <div>
          <dt>Watch out for</dt>
          <dd>{job.watchOutFor}</dd>
        </div>
        {job.compatibilityNote ? (
          <div>
            <dt>Works with</dt>
            <dd>{job.compatibilityNote}</dd>
          </div>
        ) : null}
        <div>
          <dt>Fit for this job</dt>
          <dd>{job.fitScore} of 5 (editorial estimate, not a test result)</dd>
        </div>
      </dl>

      <p className={styles.source}>
        <span>Source: {SOURCE_LABELS[job.sourceLabel]}</span>
        <span>Last verified: {job.lastVerified ?? "Not verified"}</span>
        {job.officialUrl ? (
          <a href={job.officialUrl} target="_blank" rel="noopener noreferrer">
            Official page
            <ExternalLinkIcon />
            <span className={controls.srOnly}> (opens in a new tab)</span>
          </a>
        ) : null}
      </p>

      {job.alternatives.length > 0 ? (
        <div className={styles.more}>
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setChosen(!open)}
          >
            See other options
            <ChevronDownIcon />
          </button>
          <div id={panelId} className={styles.panel} data-open={open}>
            <div className={styles.panelInner} inert={!open}>
              <ul className={styles.alternatives}>
                {job.alternatives.map((alternative) => (
                  <li key={alternative.toolId}>
                    Choose <strong>{alternative.toolName}</strong> if{" "}
                    {alternative.chooseIf}.
                    {alternative.paidOnly ? (
                      <span className={styles.paid}>Paid only</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
