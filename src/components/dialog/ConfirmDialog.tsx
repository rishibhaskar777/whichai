"use client";

import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import controls from "@/styles/controls.module.css";
import { Dialog } from "./Dialog";
import styles from "./Dialog.module.css";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  /** When set, the confirm button stays off until this exact text is typed. */
  requireText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  // Remounting the form on open and close forgets any text typed before.
  return <ConfirmForm key={String(props.open)} {...props} />;
}

function ConfirmForm({
  open,
  title,
  description,
  confirmLabel,
  requireText,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const descriptionId = useId();
  const inputId = useId();
  const [typed, setTyped] = useState("");

  const ready = requireText === undefined || typed === requireText;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      labelledBy={titleId}
      describedBy={descriptionId}
    >
      <form
        className={styles.body}
        method="dialog"
        onSubmit={(event) => {
          event.preventDefault();
          if (ready) onConfirm();
        }}
      >
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        <p id={descriptionId} className={styles.text}>
          {description}
        </p>
        {requireText !== undefined ? (
          <div className={styles.field}>
            <label htmlFor={inputId}>
              {t("confirm.typeToConfirm", { text: requireText })}
            </label>
            <input
              id={inputId}
              className={styles.input}
              value={typed}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              onChange={(event) => setTyped(event.target.value)}
            />
          </div>
        ) : null}
        <div className={styles.actions}>
          <button type="button" className={controls.button} onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className={`${controls.button} ${danger ? styles.danger : controls.primary}`}
            disabled={!ready}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
