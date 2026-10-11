"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CloseIcon } from "@/components/icons";
import type { ProviderAvailability } from "@/lib/auth/config";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { useI18n } from "@/lib/i18n/provider";
import { SignInPanel, type AuthView, type ViewRequest } from "./SignInPanel";
import styles from "./SignIn.module.css";

interface SignInContextValue {
  /**
   * Pass the button that was pressed so focus can return to it on close.
   * The dialog shows the login view unless another is asked for.
   */
  open: (opener: HTMLElement | null, view?: AuthView) => void;
}

const SignInContext = createContext<SignInContextValue | null>(null);

export function useSignIn(): SignInContextValue {
  const context = useContext(SignInContext);
  if (!context) throw new Error("useSignIn must be used inside SignInProvider");
  return context;
}

const AUTH_PARAM = "auth";

function parseView(value: string | null): AuthView | null {
  return value === "login" || value === "register" ? value : null;
}

interface SignInProviderProps {
  providers: ProviderAvailability;
  children: ReactNode;
}

export function SignInProvider({ providers, children }: SignInProviderProps) {
  const { t } = useI18n();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Remounting the panel while the dialog is closed clears a stuck loading
  // state. Doing it on open would destroy the element the browser just focused.
  const [resetCount, setResetCount] = useState(0);
  const [request, setRequest] = useState<ViewRequest>({
    view: "login",
    id: 0,
  });

  const open = useCallback(
    (opener: HTMLElement | null, view: AuthView = "login") => {
      const dialog = dialogRef.current;
      if (!dialog || dialog.open) return;
      openerRef.current = opener;
      setRequest((current) => ({ view, id: current.id + 1 }));
      dialog.showModal();
    },
    [],
  );

  const close = useCallback(() => dialogRef.current?.close(), []);

  // Only a real change of page closes it. Without this check, React's dev
  // double-run of effects would close a dialog that /?auth= had just opened.
  const lastPathname = useRef(pathname);
  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    close();
  }, [pathname, close]);

  // /?auth=login and /?auth=register open the dialog, then leave the address
  // clean so a refresh or a shared link does not open it again.
  useEffect(() => {
    const url = new URL(window.location.href);
    const view =
      parseView(searchParams.get(AUTH_PARAM)) ??
      parseView(url.searchParams.get(AUTH_PARAM));
    if (!view) return;
    open(null, view);
    url.searchParams.delete(AUTH_PARAM);
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [pathname, searchParams, open]);

  const value = useMemo(() => ({ open }), [open]);

  return (
    <SignInContext.Provider value={value}>
      {children}
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="sign-in-dialog-title"
        onClose={() => {
          openerRef.current?.focus();
          openerRef.current = null;
          setResetCount((count) => count + 1);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <SignInPanel
          key={resetCount}
          providers={providers}
          next={safeRedirectPath(pathname)}
          headingLevel="h2"
          titleId="sign-in-dialog-title"
          viewRequest={request}
          onDone={close}
        />
        <button
          type="button"
          className={styles.close}
          onClick={close}
          aria-label={t("signin.close")}
        >
          <CloseIcon />
        </button>
      </dialog>
    </SignInContext.Provider>
  );
}
