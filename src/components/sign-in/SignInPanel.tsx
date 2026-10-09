"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "@/components/wordmark/Wordmark";
import { AUTH_ERRORS, type AuthErrorCode } from "@/lib/auth/errors";
import type { ProviderAvailability } from "@/lib/auth/config";
import type { ProviderId } from "@/lib/env";
import { GitHubMark, GoogleMark } from "./ProviderMarks";
import styles from "./SignIn.module.css";

interface SignInPanelProps {
  providers: ProviderAvailability;
  next: string;
  headingLevel: "h1" | "h2";
  titleId: string;
  error?: AuthErrorCode | null;
  onNavigate?: () => void;
}

const PROVIDER_LABELS: Record<ProviderId, string> = {
  google: "Google",
  github: "GitHub",
};

export function SignInPanel({
  providers,
  next,
  headingLevel: Heading,
  titleId,
  error = null,
  onNavigate,
}: SignInPanelProps) {
  const [loading, setLoading] = useState<ProviderId | null>(null);
  const available = (["google", "github"] as const).filter(
    (provider) => providers[provider],
  );
  const notConfigured = available.length === 0;
  const message = notConfigured ? AUTH_ERRORS["not-configured"] : null;

  // Coming back with the browser's back button restores this page as it was.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setLoading(null);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <div className={styles.panel}>
      <div className={styles.brand}>
        <Wordmark />
      </div>
      <Heading id={titleId} className={styles.title}>
        Sign in to WhichAI
      </Heading>
      <p className={styles.lede}>
        Sign in to keep your plans. For now your plans stay in this browser.
      </p>

      {error && !notConfigured ? (
        <p role="alert" className={styles.error}>
          {AUTH_ERRORS[error]}
        </p>
      ) : null}

      {message ? (
        <p role="status" className={styles.notice}>
          {message}
        </p>
      ) : (
        <div className={styles.buttons}>
          {available.map((provider) => {
            const busy = loading !== null;
            const Mark = provider === "google" ? GoogleMark : GitHubMark;
            return (
              <a
                key={provider}
                href={`/api/auth/sign-in/${provider}?next=${encodeURIComponent(next)}`}
                className={`${styles.provider} ${styles[provider]}`}
                aria-disabled={busy}
                data-loading={loading === provider}
                onClick={(event) => {
                  if (busy) {
                    event.preventDefault();
                    return;
                  }
                  setLoading(provider);
                }}
              >
                {loading === provider ? (
                  <span className={styles.spinner} aria-hidden="true" />
                ) : (
                  <Mark />
                )}
                <span>Continue with {PROVIDER_LABELS[provider]}</span>
              </a>
            );
          })}
          <p role="status" className={styles.srOnly}>
            {loading ? `Opening ${PROVIDER_LABELS[loading]} sign-in` : ""}
          </p>
        </div>
      )}

      <p className={styles.fine}>
        We only receive your name from Google or GitHub. We never see your
        password.{" "}
        <Link href="/privacy" onClick={() => onNavigate?.()}>
          Privacy
        </Link>
      </p>
    </div>
  );
}
