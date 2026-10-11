"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useAccount } from "@/components/account/AccountProvider";
import { InfoIcon } from "@/components/icons";
import { Wordmark } from "@/components/wordmark/Wordmark";
import type { AuthErrorCode } from "@/lib/auth/errors";
import type { ProviderAvailability } from "@/lib/auth/config";
import { useI18n } from "@/lib/i18n/provider";
import { entitlementsFor, GUEST_TIER } from "@/lib/plans/entitlements";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { GoogleButton } from "./GoogleButton";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import styles from "./SignIn.module.css";

export type AuthView = "login" | "register";

/** Asks the panel to show a view. A new `id` is a new request. */
export interface ViewRequest {
  view: AuthView;
  id: number;
}

interface SignInPanelProps {
  providers: ProviderAvailability;
  next: string;
  headingLevel: "h1" | "h2";
  titleId: string;
  error?: AuthErrorCode | null;
  initialView?: AuthView;
  viewRequest?: ViewRequest;
  /**
   * Called after a login or when a guest profile is made. The dialog closes;
   * the standalone page falls back to going to `next`.
   */
  onDone?: () => void;
}

/* Long enough to clean up after the height transition if its event is missed. */
const HEIGHT_TRANSITION_FALLBACK_MS = 400;

export function SignInPanel({
  providers,
  next,
  headingLevel: Heading,
  titleId,
  error = null,
  initialView = "login",
  viewRequest,
  onDone,
}: SignInPanelProps) {
  const { t, formatNumber } = useI18n();
  const router = useRouter();
  const { continueAsGuest } = useAccount();
  const reducedMotion = useReducedMotion();

  const panelRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const heightBefore = useRef<number | null>(null);
  const focusTitle = useRef(false);

  const [view, setView] = useState<AuthView>(initialView);
  const [switched, setSwitched] = useState(false);
  const [email, setEmail] = useState("");
  const [created, setCreated] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [comingSoon, setComingSoon] = useState<number | null>(null);
  const [guestPending, setGuestPending] = useState(false);

  // Coming back with the browser's back button restores this page as it was.
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setGoogleLoading(false);
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  // The dialog asked for a view while it was closed: no animation, no focus.
  const handledRequest = useRef(viewRequest?.id ?? 0);
  useLayoutEffect(() => {
    if (!viewRequest || viewRequest.id === handledRequest.current) return;
    handledRequest.current = viewRequest.id;
    setView(viewRequest.view);
    setCreated(false);
  }, [viewRequest]);

  const switchTo = useCallback(
    (nextView: AuthView) => {
      const viewport = viewportRef.current;
      heightBefore.current =
        viewport && !reducedMotion ? viewport.offsetHeight : null;
      focusTitle.current = true;
      setSwitched(true);
      setView(nextView);
    },
    [reducedMotion],
  );

  // Animate the height from the old view to the new one, then let it be auto.
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const before = heightBefore.current;
    heightBefore.current = null;
    if (!viewport || before === null) return;
    const after = viewport.offsetHeight;
    if (before === after) return;

    viewport.style.height = `${before}px`;
    void viewport.offsetHeight;
    viewport.style.height = `${after}px`;

    const finish = () => {
      viewport.style.height = "";
      viewport.removeEventListener("transitionend", finish);
    };
    viewport.addEventListener("transitionend", finish);
    const timer = window.setTimeout(finish, HEIGHT_TRANSITION_FALLBACK_MS);
    return () => {
      window.clearTimeout(timer);
      finish();
    };
  }, [view]);

  useEffect(() => {
    if (!focusTitle.current) return;
    focusTitle.current = false;
    const title = titleRef.current;
    if (!title) return;
    // Made focusable only now, so the dialog's own first focus lands on a
    // control and not on the heading.
    title.tabIndex = -1;
    title.focus();
  }, [view]);

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
  }, [view, created, comingSoon]);

  const finish = useCallback(() => {
    if (onDone) onDone();
    else router.push(next);
  }, [onDone, router, next]);

  async function startGuest() {
    if (guestPending) return;
    setGuestPending(true);
    await continueAsGuest();
    setGuestPending(false);
    finish();
  }

  const visibleError = error && error !== "not-configured" ? error : null;
  const login = view === "login";

  return (
    <div ref={panelRef} className={styles.panel}>
      <div className={styles.viewport} ref={viewportRef}>
        <div
          key={view}
          className={styles.view}
          data-fade={switched ? "true" : undefined}
        >
          <div className={styles.header}>
            <span className={styles.logo} aria-hidden="true">
              <Wordmark showName={false} />
            </span>
            <Heading id={titleId} ref={titleRef} className={styles.title}>
              {login ? t("signin.login.title") : t("signin.register.title")}
            </Heading>
            <p className={styles.lede}>
              {login ? t("signin.login.lede") : t("signin.register.lede")}
            </p>
          </div>

          {login && created ? (
            <p role="status" className={styles.success}>
              {t("signin.register.success")}
            </p>
          ) : null}

          {login && visibleError ? (
            <p role="alert" className={styles.error}>
              {t(`auth.error.${visibleError}`)}
            </p>
          ) : null}

          <div className={styles.buttons}>
            <GoogleButton
              mode={view}
              available={providers.google}
              next={next}
              loading={googleLoading}
              disabled={guestPending}
              onStart={() => setGoogleLoading(true)}
              onComingSoon={() => setComingSoon((count) => (count ?? 0) + 1)}
            />
            <div role="status" aria-live="polite" className={styles.noticeSlot}>
              {comingSoon !== null ? (
                <p key={comingSoon} className={styles.notice}>
                  {t("signin.comingSoon", { name: "Google" })}
                </p>
              ) : null}
            </div>
            <p role="status" className={styles.srOnly}>
              {googleLoading ? t("signin.opening", { name: "Google" }) : ""}
            </p>
          </div>

          <div className={styles.divider}>
            <span className={styles.rule} aria-hidden="true" />
            <span className={styles.dividerText}>{t("signin.or")}</span>
            <span className={styles.rule} aria-hidden="true" />
          </div>

          {login ? (
            <LoginForm
              initialEmail={email}
              disabled={googleLoading || guestPending}
              onSignedIn={finish}
              onRegister={() => {
                setCreated(false);
                switchTo("register");
              }}
            />
          ) : (
            <RegisterForm
              disabled={googleLoading}
              onRegistered={(registered) => {
                setEmail(registered);
                setCreated(true);
                switchTo("login");
              }}
              onLogin={() => switchTo("login")}
            />
          )}

          <div className={styles.footer}>
            <p className={styles.preview}>
              <span className={styles.badge}>
                <InfoIcon width="14" height="14" />
                {t("signin.preview.badge")}
              </span>
              <span>{t("signin.preview")}</span>
            </p>
            {login ? (
              <div className={styles.guest}>
                <button
                  type="button"
                  className={styles.dismiss}
                  disabled={googleLoading || guestPending}
                  onClick={() => void startGuest()}
                >
                  {t("signin.dismiss")}
                </button>
                <p className={styles.guestLimit}>
                  {t("signin.guestLimit", {
                    count: formatNumber(
                      entitlementsFor(GUEST_TIER).dailyPlans ?? 0,
                    ),
                  })}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
