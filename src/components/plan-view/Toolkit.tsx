import { useId } from "react";
import type { JobCategory } from "@/lib/schemas/catalogue";
import type { ToolkitGroup } from "@/lib/schemas/plan";
import styles from "./Toolkit.module.css";

const CATEGORY_LABELS: Record<JobCategory, string> = {
  ai: "AI",
  build: "Build",
  design: "Design",
  media: "Media",
  productivity: "Productivity",
  learning: "Learning",
  research: "Research",
};

interface ToolkitProps {
  groups: readonly ToolkitGroup[];
  onSelect: (jobId: string) => void;
}

export function Toolkit({ groups, onSelect }: ToolkitProps) {
  const titleId = useId();
  const labelPrefix = useId();

  return (
    <section className={styles.toolkit} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        Your toolkit at a glance
      </h2>
      <div className={styles.groups}>
        {groups.map((group) => {
          const labelId = `${labelPrefix}-${group.category}`;
          return (
            <div
              key={group.category}
              role="group"
              aria-labelledby={labelId}
              className={styles.group}
            >
              <p id={labelId} className={styles.groupLabel}>
                {CATEGORY_LABELS[group.category]}
              </p>
              <ul className={styles.chips}>
                {group.tools.map((tool) => (
                  <li key={tool.toolId}>
                    <button
                      type="button"
                      className={styles.chip}
                      aria-label={`Go to ${tool.toolName}`}
                      onClick={() => onSelect(tool.jobId)}
                    >
                      {tool.toolName}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
