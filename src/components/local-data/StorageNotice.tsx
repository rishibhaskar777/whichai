"use client";

import { useI18n } from "@/lib/i18n/provider";
import { useLocalData } from "./LocalDataProvider";
import styles from "./StorageNotice.module.css";

/** Said once, gently, where saving matters: storage is off in this browser. */
export function StorageNotice() {
  const { t } = useI18n();
  const { status, persistent } = useLocalData();
  if (status !== "ready" || persistent) return null;
  return (
    <p role="note" className={styles.notice}>
      {t("storage.notice")}
    </p>
  );
}
