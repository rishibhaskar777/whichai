"use client";

import { useId, useState } from "react";
import { ChevronDownIcon, ExternalLinkIcon } from "@/components/icons";
import type {
  Alternative,
  JobRecommendation,
  JobTag,
  SourceLabel,
} from "@/lib/schemas/plan";
import controls from "@/styles/controls.module.css";
import styles from "./JobCard.module.css";

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

interface JobCardProps {
  job: JobRecommendation;
  tag: JobTag;
  alternatives: readonly Alternative[];
}

export function JobCard({ job, tag, alternatives }: JobCardProps) {
  const titleId = useId();
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div>
          <p className={styles.jobName}>{job.jobName}</p>
          <h4 id={titleId} className={styles.toolName}>
            {job.toolName}
          </h4>
        </div>
        <span className={styles.tag} data-tag={tag}>
          {TAG_LABELS[tag]}
        </span>
      </header>

      <p className={styles.why}>{job.why}</p>

      <dl className={styles.facts}>
        <div>
          <dt>Pricing</dt>
          <dd>{job.pricing}</dd>
        </div>
        <div>
          <dt>Watch out for</dt>
          <dd>{job.watchOutFor}</dd>
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

      {alternatives.length > 0 ? (
        <div className={styles.more}>
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((current) => !current)}
          >
            See other options
            <ChevronDownIcon />
          </button>
          <div id={panelId} className={styles.panel} data-open={open}>
            <div className={styles.panelInner} inert={!open}>
              <ul className={styles.alternatives}>
                {alternatives.map((alternative) => (
                  <li key={alternative.toolName}>
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
