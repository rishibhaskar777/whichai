"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  firstIssues,
  registerSchema,
} from "@/lib/auth/preview-schemas";
import { useI18n } from "@/lib/i18n/provider";
import controls from "@/styles/controls.module.css";
import {
  ErrorSummary,
  PasswordField,
  TextField,
  useIssueText,
  type SummaryItem,
} from "./AuthFields";
import styles from "./SignIn.module.css";

type Field = "email" | "password" | "firstName" | "lastName" | "terms";

type Errors = Partial<Record<Field, string | undefined>>;

const LABELS = {
  email: "auth.field.email",
  password: "auth.field.password",
  firstName: "auth.field.firstName",
  lastName: "auth.field.lastName",
} as const;

const FIELD_ORDER: readonly Field[] = [
  "email",
  "password",
  "firstName",
  "lastName",
  "terms",
];

interface RegisterFormProps {
  disabled: boolean;
  onRegistered: (email: string) => void;
  onLogin: () => void;
}

export function RegisterForm({
  disabled,
  onRegistered,
  onLogin,
}: RegisterFormProps) {
  const { t, rich } = useI18n();
  const { register } = useAccount();
  const issueText = useIssueText();
  const ids = {
    email: useId(),
    password: useId(),
    firstName: useId(),
    lastName: useId(),
    terms: useId(),
  };
  const summaryRef = useRef<HTMLDivElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clear = (field: Field) =>
    setErrors((current) => ({ ...current, [field]: undefined }));

  // The summary names the fields; each message sits under its own field.
  const items: SummaryItem[] = FIELD_ORDER.flatMap((field) => {
    const message = issueText(errors[field]);
    if (!message) return [];
    const label = field === "terms" ? message : t(LABELS[field]);
    return [{ fieldId: ids[field], text: label }];
  });

  function showProblems(next: Errors, message: string | null) {
    setErrors(next);
    setFormError(message);
    requestAnimationFrame(() => summaryRef.current?.focus());
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || disabled) return;

    // Whatever the last attempt said is gone the moment a new one starts, so
    // the next message is announced again and cannot be mistaken for it.
    setFormError(null);
    setErrors({});

    const parsed = registerSchema.safeParse({
      email,
      password,
      firstName,
      lastName,
      terms,
    });
    if (!parsed.success) {
      showProblems(firstIssues<Field>(parsed.error), null);
      return;
    }

    setErrors({});
    setFormError(null);
    setSubmitting(true);
    const result = await register(parsed.data);
    setSubmitting(false);

    if (result.ok) {
      onRegistered(result.email);
    } else if (result.reason === "duplicate") {
      showProblems({}, t("auth.error.duplicate"));
    } else if (result.reason === "storage") {
      showProblems({}, t("auth.error.storage"));
    } else {
      showProblems({}, t("auth.error.invalid"));
    }
  }

  const length = password.length;
  const hint =
    length === 0
      ? t("auth.password.hint")
      : length > MAX_PASSWORD_LENGTH
        ? t("auth.password.hint.over")
        : length < MIN_PASSWORD_LENGTH
          ? t("auth.password.hint.more", {
              count: MIN_PASSWORD_LENGTH - length,
            })
          : t("auth.password.hint.ok");

  const newTab = <span className={controls.srOnly}>{t("link.newTab")}</span>;
  const termsError = issueText(errors.terms);

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
          clear("email");
        }}
        error={issueText(errors.email)}
      />

      <PasswordField
        inputId={ids.password}
        label={t("auth.field.password")}
        autoComplete="new-password"
        placeholder={t("auth.placeholder.newPassword")}
        value={password}
        onChange={(value) => {
          setPassword(value);
          clear("password");
        }}
        hint={errors.password ? undefined : hint}
        error={issueText(errors.password)}
      />

      <div className={styles.nameRow}>
        <TextField
          inputId={ids.firstName}
          label={t("auth.field.firstName")}
          autoComplete="given-name"
          value={firstName}
          onChange={(value) => {
            setFirstName(value);
            clear("firstName");
          }}
          error={issueText(errors.firstName)}
        />
        <TextField
          inputId={ids.lastName}
          label={t("auth.field.lastName")}
          autoComplete="family-name"
          value={lastName}
          onChange={(value) => {
            setLastName(value);
            clear("lastName");
          }}
          error={issueText(errors.lastName)}
        />
      </div>

      <div className={styles.field}>
        <div className={styles.checkRow}>
          <input
            id={ids.terms}
            type="checkbox"
            className={styles.checkbox}
            checked={terms}
            aria-invalid={termsError ? true : undefined}
            aria-describedby={termsError ? `${ids.terms}-error` : undefined}
            onChange={(event) => {
              setTerms(event.target.checked);
              clear("terms");
            }}
          />
          <label htmlFor={ids.terms} className={styles.checkLabel}>
            {rich("auth.terms.label", {
              terms: (
                <a href="/terms" target="_blank" rel="noopener noreferrer">
                  {t("terms.title")}
                  {newTab}
                </a>
              ),
              privacy: (
                <a href="/privacy" target="_blank" rel="noopener noreferrer">
                  {t("auth.terms.privacy")}
                  {newTab}
                </a>
              ),
            })}
          </label>
        </div>
        {termsError ? (
          <p id={`${ids.terms}-error`} className={styles.fieldError}>
            {termsError}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        className={styles.submit}
        disabled={!terms || submitting || disabled}
        data-loading={submitting}
      >
        {submitting ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : null}
        <span>
          {submitting
            ? t("signin.register.submitting")
            : t("signin.register.submit")}
        </span>
      </button>

      <p className={styles.switchLine}>
        {t("signin.register.existing")}{" "}
        <button type="button" className={styles.linkButton} onClick={onLogin}>
          {t("signin.register.loginLink")}
        </button>
      </p>
    </form>
  );
}
