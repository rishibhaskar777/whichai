"use client";

import { useId, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { useI18n } from "@/lib/i18n/provider";
import { MAX_IMPORT_BYTES } from "@/lib/storage/limits";
import { parseBackup, type ParsedBackup } from "@/lib/storage/operations";
import controls from "@/styles/controls.module.css";
import styles from "./Settings.module.css";

type ImportMode = "merge" | "replace";

const ERROR_KEYS = {
  "too-large": "import.error.tooLarge",
  "not-json": "import.error.notJson",
  "wrong-shape": "import.error.wrongShape",
  empty: "import.error.empty",
} as const;

export function ImportData() {
  const { t, tn } = useI18n();
  const { importBackup } = useLocalData();
  const fileInputId = useId();
  const modeName = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [backup, setBackup] = useState<ParsedBackup | null>(null);
  const [mode, setMode] = useState<ImportMode>("merge");
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);
  const [confirmingReplace, setConfirmingReplace] = useState(false);

  function reset() {
    setBackup(null);
    setMode("merge");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function chooseFile(file: File | undefined) {
    setMessage(null);
    setBackup(null);
    if (!file) return;
    // The size is checked before the file is read into memory.
    if (file.size > MAX_IMPORT_BYTES) {
      setMessage({ text: t("import.error.tooLarge"), isError: true });
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setMessage({ text: t("import.error.unreadable"), isError: true });
      return;
    }
    const parsed = parseBackup(text);
    if (!parsed.ok) {
      setMessage({ text: t(ERROR_KEYS[parsed.error]), isError: true });
      return;
    }
    setBackup(parsed.backup);
  }

  async function runImport() {
    if (!backup) return;
    setConfirmingReplace(false);
    const result = await importBackup(backup, mode);
    if (!result.ok) {
      setMessage({ text: t("import.failed"), isError: true });
      return;
    }
    const { dropped } = result.value;
    const done = t("import.done");
    setMessage({
      text: dropped > 0 ? `${done} ${tn("import.dropped", dropped)}` : done,
      isError: false,
    });
    reset();
  }

  const summary = backup
    ? [
        backup.plans.length > 0 ? tn("import.plans", backup.plans.length) : "",
        backup.history.length > 0
          ? tn("import.history", backup.history.length)
          : "",
        backup.settings ? t("import.settingsIncluded") : "",
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className={styles.importBox}>
      <label htmlFor={fileInputId} className={controls.srOnly}>
        {t("settings.import.choose")}
      </label>
      <input
        id={fileInputId}
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className={styles.file}
        onChange={(event) => void chooseFile(event.target.files?.[0])}
      />

      {backup ? (
        <div className={styles.preview}>
          <p>{t("import.preview", { items: summary })}</p>
          {backup.skipped > 0 ? (
            <p className={styles.rowHelp}>
              {tn("import.skipped", backup.skipped)}
            </p>
          ) : null}
          <fieldset className={styles.modes}>
            <legend>{t("import.mode")}</legend>
            {(["merge", "replace"] as const).map((option) => (
              <label key={option} className={styles.mode}>
                <input
                  type="radio"
                  name={modeName}
                  value={option}
                  checked={mode === option}
                  onChange={() => setMode(option)}
                />
                <span>
                  <strong>{t(`import.${option}`)}</strong>
                  <span className={styles.rowHelp}>
                    {t(`import.${option}.help`)}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className={styles.buttons}>
            <button
              type="button"
              className={`${controls.button} ${controls.primary}`}
              onClick={() =>
                mode === "replace"
                  ? setConfirmingReplace(true)
                  : void runImport()
              }
            >
              {t("import.button")}
            </button>
            <button type="button" className={controls.button} onClick={reset}>
              {t("common.cancel")}
            </button>
          </div>
        </div>
      ) : null}

      <p
        role={message?.isError ? "alert" : "status"}
        className={message?.isError ? styles.error : styles.success}
      >
        {message?.text}
      </p>

      <ConfirmDialog
        open={confirmingReplace}
        title={t("import.replaceTitle")}
        description={t("import.replaceText")}
        confirmLabel={t("import.replaceConfirm")}
        danger
        onCancel={() => setConfirmingReplace(false)}
        onConfirm={() => void runImport()}
      />
    </div>
  );
}
