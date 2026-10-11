"use client";

import {
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from "react";
import { useI18n } from "@/lib/i18n/provider";
import { isMessageKey } from "@/lib/i18n/keys";
import styles from "./SignIn.module.css";

/** An interface message key from a validation issue, or a plain fallback. */
export function useIssueText() {
  const { t } = useI18n();
  return (message: string | undefined): string | undefined => {
    if (message === undefined) return undefined;
    return isMessageKey(message) ? t(message) : t("auth.error.invalid");
  };
}

interface TextFieldProps {
  label: string;
  type?: "text" | "email";
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  hint?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
  disabled?: boolean;
  /** Passes the generated ids up so the error summary can link to the field. */
  inputId?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

export function TextField({
  label,
  type = "text",
  autoComplete,
  value,
  onChange,
  error,
  hint,
  inputRef,
  disabled,
  inputId,
  placeholder,
  autoFocus,
}: TextFieldProps) {
  const generated = useId();
  const id = inputId ?? generated;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") ||
    undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type={type}
        className={styles.input}
        autoComplete={autoComplete}
        autoCapitalize={type === "email" ? "none" : undefined}
        spellCheck={false}
        placeholder={placeholder}
        autoFocus={autoFocus}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface PasswordFieldProps extends Omit<TextFieldProps, "type"> {
  autoComplete: "current-password" | "new-password";
  /** Sits at the right end of the label row, such as "Forgot password?". */
  labelAction?: ReactNode;
}

/** A password input with a show and hide button that has its own label. */
export function PasswordField({
  label,
  autoComplete,
  value,
  onChange,
  error,
  hint,
  inputRef,
  disabled,
  inputId,
  placeholder,
  labelAction,
}: PasswordFieldProps) {
  const { t } = useI18n();
  const generated = useId();
  const id = inputId ?? generated;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const capsId = `${id}-caps`;
  const [shown, setShown] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  // The Caps Lock notice takes the hint line, so the field never grows.
  const showHint = Boolean(hint) && !capsOn;
  const describedBy =
    [capsOn ? capsId : null, showHint ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  // A key event reports whether Caps Lock is on at the moment of the press.
  const readCaps = (event: KeyboardEvent<HTMLInputElement>) => {
    if (typeof event.getModifierState === "function") {
      setCapsOn(event.getModifierState("CapsLock"));
    }
  };

  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {labelAction}
      </div>
      <div className={styles.passwordWrap}>
        <input
          ref={inputRef}
          id={id}
          type={shown ? "text" : "password"}
          className={`${styles.input} ${styles.passwordInput}`}
          autoComplete={autoComplete}
          autoCapitalize="none"
          spellCheck={false}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={readCaps}
          onKeyUp={readCaps}
          onBlur={() => setCapsOn(false)}
        />
        <button
          type="button"
          className={styles.reveal}
          aria-pressed={shown}
          aria-label={
            shown ? t("signin.password.hide") : t("signin.password.show")
          }
          onClick={() => setShown((current) => !current)}
        >
          <EyeIcon off={shown} />
        </button>
      </div>
      <p id={capsId} role="status" className={styles.capsHint}>
        {capsOn ? t("auth.capsLock") : ""}
      </p>
      {showHint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className={styles.fieldError}>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {off ? <path d="M4 4l16 16" /> : null}
    </svg>
  );
}

export interface SummaryItem {
  /** The id of the field the problem belongs to. */
  fieldId: string;
  text: string;
}

interface ErrorSummaryProps {
  /** One problem that belongs to the whole form, such as a wrong password. */
  message?: string | null;
  items?: readonly SummaryItem[];
  summaryRef: Ref<HTMLDivElement>;
}

/**
 * Collects what is wrong after a submit. It is announced as an alert and
 * receives focus, and each field problem links to its input.
 */
export function ErrorSummary({
  message = null,
  items = [],
  summaryRef,
}: ErrorSummaryProps) {
  const { t } = useI18n();
  if (!message && items.length === 0) return null;
  return (
    <div ref={summaryRef} role="alert" tabIndex={-1} className={styles.summary}>
      {message ? <p>{message}</p> : null}
      {items.length > 0 ? (
        <>
          <p>{t("auth.error.summary")}</p>
          <ul className={styles.summaryList}>
            {items.map((item) => (
              <li key={item.fieldId}>
                <a
                  href={`#${item.fieldId}`}
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(item.fieldId)?.focus();
                  }}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
