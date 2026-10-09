"use client";

import { usePathname } from "next/navigation";
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
import { SignInPanel } from "./SignInPanel";
import styles from "./SignIn.module.css";

interface SignInContextValue {
  /* Pass the button that was pressed so focus can return to it on close. */
  open: (opener: HTMLElement) => void;
}

const SignInContext = createContext<SignInContextValue | null>(null);

export function useSignIn(): SignInContextValue {
  const context = useContext(SignInContext);
  if (!context) throw new Error("useSignIn must be used inside SignInProvider");
  return context;
}

interface SignInProviderProps {
  providers: ProviderAvailability;
  children: ReactNode;
}

export function SignInProvider({ providers, children }: SignInProviderProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();
  // Remounting the panel while the dialog is closed clears a stuck loading
  // state. Doing it on open would destroy the element the browser just focused.
  const [resetCount, setResetCount] = useState(0);

  const open = useCallback((opener: HTMLElement) => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    openerRef.current = opener;
    dialog.showModal();
  }, []);

  const close = useCallback(() => dialogRef.current?.close(), []);

  useEffect(() => {
    close();
  }, [pathname, close]);

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
          onDismiss={close}
          onNavigate={close}
        />
        <button
          type="button"
          className={styles.close}
          onClick={close}
          aria-label="Close sign-in"
        >
          <CloseIcon />
        </button>
      </dialog>
    </SignInContext.Provider>
  );
}
