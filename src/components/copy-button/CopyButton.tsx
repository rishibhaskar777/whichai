"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/provider";
import controls from "@/styles/controls.module.css";
import styles from "./CopyButton.module.css";

const COPIED_VISIBLE_MS = 2000;

type CopyState = "idle" | "copied" | "failed";

interface CopyButtonProps {
  text: string;
  label: string;
  variant?: "small" | "primary";
}

export function CopyButton({
  text,
  label,
  variant = "small",
}: CopyButtonProps) {
  const { t } = useI18n();
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
      timer.current = window.setTimeout(
        () => setState("idle"),
        COPIED_VISIBLE_MS,
      );
    } catch {
      setState("failed");
    }
  }

  const className =
    variant === "primary"
      ? `${controls.button} ${controls.primary}`
      : `${controls.button} ${styles.small}`;

  return (
    <span className={styles.wrap} data-print-hide="">
      <button
        type="button"
        className={className}
        aria-label={label}
        onClick={copy}
      >
        {state === "copied" ? <CheckIcon /> : <CopyIcon />}
        <span aria-hidden="true">
          {state === "copied"
            ? t("copy.done")
            : variant === "primary"
              ? label
              : t("copy.short")}
        </span>
      </button>
      <span
        role="status"
        className={state === "failed" ? styles.failure : controls.srOnly}
      >
        {state === "copied" ? t("copy.announce") : null}
        {state === "failed" ? t("copy.failed") : null}
      </span>
    </span>
  );
}
