"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { useI18n } from "@/lib/i18n/provider";
import { firstIssues, loginSchema } from "@/lib/auth/preview-schemas";
import {
  ErrorSummary,
  PasswordField,
  TextField,
  useIssueText,
  type SummaryItem,
} from "./AuthFields";
import styles from "./SignIn.module.css";

type Field = "email" | "password";

const LABELS = {
  email: "auth.field.email",
  password: "auth.field.password",
} as const;

type Errors = Partial<Record<Field, string | undefined>>;

interface FormState {
  password: string;
  errors: Errors;
  formError: string | null;
}

interface LoginFormProps {
  initialEmail: string;
  disabled: boolean;
  onSignedIn: () => void;
  onRegister: () => void;
}

export function LoginForm({
  initialEmail,
  disabled,
  onSignedIn,
  onRegister,
}: LoginFormProps) {
  const { t } = useI18n();
  const { login } = useAccount();
  const issueText = useIssueText();
  const ids = { email: useId(), password: useId() };
  const summaryRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState(initialEmail);
  /*
   * The password and the messages about it change together in one state
   * object, so an attempt that fails clears the password in the same update
   * that shows the message, and nothing touches the field after that.
   */
  const [form, setForm] = useState<FormState>({
    password: "",
    errors: {},
    formError: null,
  });
  const { password, errors, formError } = form;
  const [submitting, setSubmitting] = useState(false);
  // A ref, so a second submit in the same tick cannot slip past a stale state.
  const inFlight = useRef(false);
  const [forgot, setForgot] = useState(false);

  const items: SummaryItem[] = (["email", "password"] as const).flatMap(
    (field) => {
      return errors[field]
        ? [{ fieldId: ids[field], text: t(LABELS[field]) }]
        : [];
    },
  );

  function showProblems(next: FormState) {
    setForm(next);
    // The summary mounts after this render, so focus it on the next frame.
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || disabled) return;

    // Whatever the last attempt said is gone the moment a new one starts, so
    // the next message is announced again and cannot be mistaken for it.
    setForm((current) => ({ ...current, errors: {}, formError: null }));

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      showProblems({
        password,
        errors: firstIssues<Field>(parsed.error),
        formError: null,
      });
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    const result = await login(parsed.data);
    inFlight.current = false;
    setSubmitting(false);

    if (result.ok) {
      onSignedIn();
      return;
    }
    // One update: the password is cleared exactly here, with the message.
    const message =
      result.reason === "locked"
        ? t("auth.error.locked", { seconds: result.retryAfterSeconds })
        : result.reason === "storage"
          ? t("auth.error.storage")
          : t("auth.error.credentials");
    showProblems({ password: "", errors: {}, formError: message });
  }

  const busy = submitting || disabled;

  return (
    <form className={styles.form} noValidate onSubmit={onSubmit}>
      <ErrorSummary summaryRef={summaryRef} message={formError} items={items} />

      <TextField
        inputId={ids.email}
        label={t("auth.field.email")}
        type="email"
        autoComplete="email"
        placeholder={t("auth.placeholder.email")}
        autoFocus
        value={email}
        onChange={(value) => {
          setEmail(value);
          setForm((current) => ({
            ...current,
            errors: { ...current.errors, email: undefined },
          }));
        }}
        error={issueText(errors.email)}
      />

      <PasswordField
        inputId={ids.password}
        label={t("auth.field.password")}
        autoComplete="current-password"
        placeholder={t("auth.placeholder.password")}
        value={password}
        onChange={(value) => {
          setForm((current) => ({
            ...current,
            password: value,
            errors: { ...current.errors, password: undefined },
          }));
        }}
        error={issueText(errors.password)}
        labelAction={
          <button
            type="button"
            className={styles.forgot}
            aria-expanded={forgot}
            aria-controls={`${ids.password}-forgot`}
            onClick={() => setForgot((current) => !current)}
          >
            {t("signin.forgot")}
          </button>
        }
      />
      <div id={`${ids.password}-forgot`} role="status">
        {forgot ? (
          <p className={styles.notice}>{t("signin.forgot.note")}</p>
        ) : null}
      </div>

      <button
        type="submit"
        className={styles.submit}
        disabled={busy}
        data-loading={submitting}
      >
        {submitting ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : null}
        <span>
          {submitting ? t("signin.login.submitting") : t("signin.login.submit")}
        </span>
      </button>

      <p className={styles.switchLine}>
        {t("signin.login.new")}{" "}
        <button
          type="button"
          className={styles.linkButton}
          onClick={onRegister}
        >
          {t("signin.login.registerLink")}
        </button>
      </p>
    </form>
  );
}
