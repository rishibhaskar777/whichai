"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
import { MailIcon, PhoneIcon } from "@/components/icons";
import { Wordmark } from "@/components/wordmark/Wordmark";
import { AUTH_ERRORS, type AuthErrorCode } from "@/lib/auth/errors";
import type { ProviderAvailability } from "@/lib/auth/config";
import {
  AppleMark,
  GitHubMark,
  GoogleMark,
  MicrosoftMark,
} from "./ProviderMarks";
import styles from "./SignIn.module.css";

type OptionId = "google" | "github" | "microsoft" | "apple" | "email" | "phone";

interface Option {
  id: OptionId;
  label: string;
  name: string;
  Mark: ComponentType<SVGProps<SVGSVGElement>>;
}

const PRIMARY_OPTIONS: readonly Option[] = [
  { id: "google", label: "Google", name: "Google", Mark: GoogleMark },
  { id: "github", label: "GitHub", name: "GitHub", Mark: GitHubMark },
  {
    id: "microsoft",
    label: "Microsoft",
    name: "Microsoft",
    Mark: MicrosoftMark,
  },
  { id: "apple", label: "Apple", name: "Apple", Mark: AppleMark },
];

const SECONDARY_OPTIONS: readonly Option[] = [
  { id: "email", label: "email", name: "Email", Mark: MailIcon },
  {
    id: "phone",
    label: "phone number",
    name: "Phone number",
    Mark: PhoneIcon,
  },
];

type LiveProvider = "google" | "github";

function isLive(id: OptionId): id is LiveProvider {
  return id === "google" || id === "github";
}

interface SignInPanelProps {
  providers: ProviderAvailability;
  next: string;
  headingLevel: "h1" | "h2";
  titleId: string;
  error?: AuthErrorCode | null;
  /* The dialog passes this; the standalone page falls back to a link. */
  onDismiss?: () => void;
  onNavigate?: () => void;
}

export function SignInPanel({
  providers,
  next,
  headingLevel: Heading,
  titleId,
  error = null,
  onDismiss,
  onNavigate,
}: SignInPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<LiveProvider | null>(null);
  const [notice, setNotice] = useState<{ text: string; count: number } | null>(
    null,
  );

  // Coming back with the browser's back button restores this page as it was.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setLoading(null);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  // Shows the fade at the bottom edge only while more content is below.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const update = () => {
      const hidden = panel.scrollHeight - panel.scrollTop - panel.clientHeight;
      panel.dataset.more = String(hidden > 4);
    };
    update();
    panel.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(panel);
    return () => {
      panel.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
    };
  }, [notice]);

  const showComingSoon = (option: Option) =>
    setNotice((current) => ({
      text: `${option.name} sign-in is coming in an upcoming update.`,
      count: (current?.count ?? 0) + 1,
    }));

  const renderOption = (option: Option) => {
    const { id, Mark } = option;
    const text = `Continue with ${option.label}`;

    if (isLive(id) && providers[id]) {
      const busy = loading !== null;
      return (
        <a
          key={id}
          href={`/api/auth/sign-in/${id}?next=${encodeURIComponent(next)}`}
          className={styles.provider}
          aria-disabled={busy}
          data-loading={loading === id}
          onClick={(event) => {
            if (busy) {
              event.preventDefault();
              return;
            }
            setLoading(id);
          }}
        >
          {loading === id ? (
            <span className={styles.spinner} aria-hidden="true" />
          ) : (
            <Mark className={styles.mark} />
          )}
          <span className={styles.providerLabel}>{text}</span>
        </a>
      );
    }

    return (
      <button
        key={id}
        type="button"
        className={styles.provider}
        aria-disabled={loading !== null}
        onClick={() => {
          if (loading === null) showComingSoon(option);
        }}
      >
        <Mark className={styles.mark} />
        <span className={styles.providerLabel}>{text}</span>
      </button>
    );
  };

  const visibleError = error && error !== "not-configured" ? error : null;

  return (
    <div ref={panelRef} className={styles.panel}>
      <div className={styles.brand}>
        <Wordmark />
      </div>
      <Heading id={titleId} className={styles.title}>
        Sign in to WhichAI
      </Heading>
      <p className={styles.lede}>
        Sign in to keep your plans. For now your plans stay in this browser.
      </p>

      {visibleError ? (
        <p role="alert" className={styles.error}>
          {AUTH_ERRORS[visibleError]}
        </p>
      ) : null}

      <div className={styles.buttons}>
        {PRIMARY_OPTIONS.map(renderOption)}
        <div className={styles.divider}>
          <span>or</span>
        </div>
        {SECONDARY_OPTIONS.map(renderOption)}

        <div role="status" aria-live="polite" className={styles.noticeSlot}>
          {notice ? (
            <p key={notice.count} className={styles.notice}>
              {notice.text}
            </p>
          ) : null}
        </div>
        <p role="status" className={styles.srOnly}>
          {loading
            ? `Opening ${loading === "google" ? "Google" : "GitHub"} sign-in`
            : ""}
        </p>
      </div>

      {onDismiss ? (
        <button type="button" className={styles.dismiss} onClick={onDismiss}>
          Continue without signing in
        </button>
      ) : (
        <Link href={next} className={styles.dismiss}>
          Continue without signing in
        </Link>
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
