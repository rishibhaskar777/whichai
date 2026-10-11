"use client";

import { useId, useRef, useState } from "react";
import { CloseIcon, PlusIcon } from "@/components/icons";
import { PartPicker } from "@/components/part-picker/PartPicker";
import { useI18n } from "@/lib/i18n/provider";
import { taskChip, taskJobIdOf } from "@/lib/plan/chips";
import type { GoalSuggestion, PartOption } from "@/lib/plan/interpret-goal";
import type { Chip } from "@/lib/schemas/plan";
import controls from "@/styles/controls.module.css";
import styles from "./UnderstandingCard.module.css";

interface UnderstandingCardProps {
  chips: readonly Chip[];
  options: readonly Chip[];
  onRemoveChip: (id: string) => void;
  onAddChip: (chip: Chip) => void;
  onEdit: () => void;
  onConfirm: () => void;
  /** Every part a person can add, for the searchable list. */
  parts?: readonly PartOption[];
  /** Goals to offer when the sentence fits more than one, or none well. */
  suggestions?: readonly GoalSuggestion[];
  onChooseGoal?: (goalType: GoalSuggestion["goalType"]) => void;
  /** Set when the sentence also names parts that can make a plan on their own. */
  onBuildFromParts?: (() => void) | undefined;
}

export function UnderstandingCard({
  chips,
  options,
  onRemoveChip,
  onAddChip,
  onEdit,
  onConfirm,
  parts = [],
  suggestions = [],
  onChooseGoal,
  onBuildFromParts,
}: UnderstandingCardProps) {
  const { t } = useI18n();
  const [picking, setPicking] = useState(false);
  const unsureId = useId();
  const titleId = useId();
  const addLabelId = useId();
  const chipListRef = useRef<HTMLUListElement>(null);
  const [change, setChange] = useState("");

  const addable = options.filter(
    (option) => !chips.some((chip) => chip.id === option.id),
  );

  function remove(chip: Chip) {
    onRemoveChip(chip.id);
    setChange(t("understanding.removed", { label: chip.label }));
    chipListRef.current?.focus();
  }

  function add(chip: Chip) {
    onAddChip(chip);
    setChange(t("understanding.added", { label: chip.label }));
    chipListRef.current?.focus();
  }

  function addPart(part: PartOption) {
    setPicking(false);
    add(taskChip(part.id, part.name));
  }

  const chosenParts = new Set(chips.flatMap((chip) => taskJobIdOf(chip) ?? []));
  const unsure = suggestions.length > 0 || onBuildFromParts !== undefined;

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h1 id={titleId} className={styles.title}>
        {t("understanding.title")}
      </h1>

      <ul
        ref={chipListRef}
        tabIndex={-1}
        className={styles.chips}
        aria-label={t("understanding.chips")}
      >
        {chips.map((chip) => (
          <li key={chip.id} className={styles.chip} data-kind={chip.kind}>
            <span>{chip.label}</span>
            {chip.kind === "goal" ? null : (
              <button
                type="button"
                className={styles.remove}
                aria-label={t("understanding.remove", { label: chip.label })}
                onClick={() => remove(chip)}
              >
                <CloseIcon />
              </button>
            )}
          </li>
        ))}
      </ul>

      {unsure ? (
        <div className={styles.unsure} role="group" aria-labelledby={unsureId}>
          <p id={unsureId} className={styles.addLabel}>
            {suggestions.length > 0
              ? t("understanding.didYouMean")
              : t("understanding.partsOnly")}
          </p>
          <ul className={styles.addList}>
            {suggestions.map((suggestion) => (
              <li key={suggestion.goalType}>
                <button
                  type="button"
                  className={styles.suggestion}
                  aria-pressed={chips.some(
                    (chip) => chip.id === `goal:${suggestion.goalType}`,
                  )}
                  onClick={() => onChooseGoal?.(suggestion.goalType)}
                >
                  {suggestion.title}
                </button>
              </li>
            ))}
            {onBuildFromParts ? (
              <li>
                <button
                  type="button"
                  className={styles.suggestion}
                  onClick={onBuildFromParts}
                >
                  {t("understanding.buildFromParts")}
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {addable.length > 0 || parts.length > 0 ? (
        <div className={styles.add} role="group" aria-labelledby={addLabelId}>
          <p id={addLabelId} className={styles.addLabel}>
            {t("understanding.addLabel")}
          </p>
          <ul className={styles.addList}>
            {addable.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  className={styles.addButton}
                  aria-label={t("understanding.add", { label: option.label })}
                  onClick={() => add(option)}
                >
                  <PlusIcon />
                  <span>{option.label}</span>
                </button>
              </li>
            ))}
            {parts.length > 0 ? (
              <li>
                <button
                  type="button"
                  className={styles.addButton}
                  aria-haspopup="dialog"
                  onClick={() => setPicking(true)}
                >
                  <PlusIcon />
                  <span>{t("understanding.addPart")}</span>
                </button>
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <PartPicker
        open={picking}
        parts={parts}
        chosen={chosenParts}
        onPick={addPart}
        onClose={() => setPicking(false)}
      />

      <p role="status" className={controls.srOnly}>
        {change}
      </p>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${controls.button} ${controls.primary}`}
          onClick={onConfirm}
        >
          {t("understanding.confirm")}
        </button>
        <button type="button" className={controls.button} onClick={onEdit}>
          {t("understanding.edit")}
        </button>
      </div>
    </section>
  );
}
