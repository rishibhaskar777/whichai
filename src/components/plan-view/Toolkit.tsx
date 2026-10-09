import { useId } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { ToolkitGroup } from "@/lib/schemas/plan";
import styles from "./Toolkit.module.css";

interface ToolkitProps {
  groups: readonly ToolkitGroup[];
  onSelect: (jobId: string) => void;
}

export function Toolkit({ groups, onSelect }: ToolkitProps) {
  const { t } = useI18n();
  const titleId = useId();
  const labelPrefix = useId();

  return (
    <section className={styles.toolkit} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {t("plan.toolkitTitle")}
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
                {t(`category.${group.category}`)}
              </p>
              <ul className={styles.chips}>
                {group.tools.map((tool) => (
                  <li key={tool.toolId}>
                    <button
                      type="button"
                      className={styles.chip}
                      aria-label={t("plan.goTo", { tool: tool.toolName })}
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
