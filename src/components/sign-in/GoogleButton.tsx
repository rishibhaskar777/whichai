"use client";

import { useI18n } from "@/lib/i18n/provider";
import { GoogleMark } from "./ProviderMarks";
import styles from "./SignIn.module.css";

interface GoogleButtonProps {
  /** True when Google sign-in is set up on this server. */
  available: boolean;
  next: string;
  loading: boolean;
  /** Another action is under way, so this one waits. */
  disabled: boolean;
  mode: "login" | "register";
  onStart: () => void;
  onComingSoon: () => void;
}

/*
 * A link to the server's OAuth route when Google is configured, otherwise a
 * button that says it is coming. The same button serves both views.
 */
export function GoogleButton({
  available,
  next,
  loading,
  disabled,
  mode,
  onStart,
  onComingSoon,
}: GoogleButtonProps) {
  const { t } = useI18n();
  const method = "Google";
  const text =
    mode === "login"
      ? t("signin.continueWith", { method })
      : t("signin.registerWith", { method });
  const busy = loading || disabled;

  if (available) {
    return (
      <a
        href={`/api/auth/sign-in/google?next=${encodeURIComponent(next)}`}
        className={styles.provider}
        aria-disabled={busy}
        data-loading={loading}
        onClick={(event) => {
          if (busy) {
            event.preventDefault();
            return;
          }
          onStart();
        }}
      >
        {loading ? (
          <span className={styles.spinner} aria-hidden="true" />
        ) : (
          <GoogleMark className={styles.mark} />
        )}
        <span className={styles.providerLabel}>{text}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      className={styles.provider}
      aria-disabled={busy}
      onClick={() => {
        if (!busy) onComingSoon();
      }}
    >
      <GoogleMark className={styles.mark} />
      <span className={styles.providerLabel}>{text}</span>
    </button>
  );
}
