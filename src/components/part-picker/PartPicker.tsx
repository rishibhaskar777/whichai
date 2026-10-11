"use client";

import { useId, useMemo, useState } from "react";
import { CheckIcon, PlusIcon } from "@/components/icons";
import { Dialog } from "@/components/dialog/Dialog";
import dialogStyles from "@/components/dialog/Dialog.module.css";
import { useI18n } from "@/lib/i18n/provider";
import type { PartOption } from "@/lib/plan/interpret-goal";
import { JOB_CATEGORIES } from "@/lib/schemas/catalogue";
import controls from "@/styles/controls.module.css";
import styles from "./PartPicker.module.css";

interface PartPickerProps {
  open: boolean;
  parts: readonly PartOption[];
  /** Ids already in the plan; they are listed but cannot be added again. */
  chosen: ReadonlySet<string>;
  onPick: (part: PartOption) => void;
  onClose: () => void;
}

/** Every word typed must appear somewhere in the part's name or keywords. */
export function filterParts(
  parts: readonly PartOption[],
  query: string,
): PartOption[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [...parts];
  return parts.filter((part) =>
    words.every((word) => part.searchText.includes(word)),
  );
}

export function PartPicker(props: PartPickerProps) {
  // Remounting on open and close forgets the last search.
  return <PartPickerBody key={String(props.open)} {...props} />;
}

function PartPickerBody({
  open,
  parts,
  chosen,
  onPick,
  onClose,
}: PartPickerProps) {
  const { t, tn } = useI18n();
  const titleId = useId();
  const searchId = useId();
  const [query, setQuery] = useState("");

  const matches = useMemo(() => filterParts(parts, query), [parts, query]);
  const groups = JOB_CATEGORIES.map((category) => ({
    category,
    parts: matches.filter((part) => part.category === category),
  })).filter((group) => group.parts.length > 0);

  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId}>
      <div className={dialogStyles.body}>
        <h2 id={titleId} className={dialogStyles.title}>
          {t("parts.title")}
        </h2>
        <p className={dialogStyles.text}>{t("parts.help")}</p>

        <div className={dialogStyles.field}>
          <label htmlFor={searchId}>{t("parts.search")}</label>
          <input
            id={searchId}
            type="search"
            className={dialogStyles.input}
            value={query}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <p role="status" className={styles.count}>
          {matches.length === 0
            ? t("parts.none")
            : tn("parts.results", matches.length)}
        </p>

        <div className={styles.groups}>
          {groups.map((group) => (
            <section key={group.category} className={styles.group}>
              <h3 className={styles.groupTitle}>
                {t(`category.${group.category}`)}
              </h3>
              <ul className={styles.list}>
                {group.parts.map((part) => {
                  const inPlan = chosen.has(part.id);
                  return (
                    <li key={part.id}>
                      <button
                        type="button"
                        className={styles.part}
                        disabled={inPlan}
                        onClick={() => onPick(part)}
                      >
                        <span className={styles.partText}>
                          <span className={styles.partName}>{part.name}</span>
                          <span className={styles.partDescription}>
                            {part.description}
                          </span>
                        </span>
                        <span className={styles.partState}>
                          {inPlan ? (
                            <>
                              <CheckIcon />
                              {t("parts.inPlan")}
                            </>
                          ) : (
                            <>
                              <PlusIcon />
                              <span className={controls.srOnly}>
                                {t("parts.add", { label: part.name })}
                              </span>
                            </>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className={dialogStyles.actions}>
          <button type="button" className={controls.button} onClick={onClose}>
            {t("common.close")}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
