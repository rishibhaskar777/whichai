"use client";

import { useId, useRef, useState } from "react";
import { CloseIcon, PlusIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/provider";
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
}

export function UnderstandingCard({
  chips,
  options,
  onRemoveChip,
  onAddChip,
  onEdit,
  onConfirm,
}: UnderstandingCardProps) {
  const { t } = useI18n();
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

      {addable.length > 0 ? (
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
          </ul>
        </div>
      ) : null}

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
