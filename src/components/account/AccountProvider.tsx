"use client";

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
import { getInitials } from "@/lib/auth/initials";
import {
  createLocalPreviewService,
  type AccountService,
  type AccountUser,
  type LoginResult,
  type RegisterResult,
} from "@/lib/auth/local-preview";
import type { LoginInput, RegisterInput } from "@/lib/auth/preview-schemas";
import { openBackend, type KvBackend } from "@/lib/storage/backend";

/*
 * Who is using the app on this browser. A Google sign-in comes from the
 * server as a Viewer and takes precedence over this wherever both exist.
 */
export type Identity =
  | { kind: "preview"; name: string; initials: string }
  | { kind: "guest" }
  | { kind: "none" };

export interface AccountContextValue {
  /** "loading" until this browser's account storage has been read. */
  status: "loading" | "ready";
  identity: Identity;
  /**
   * Names the profile that per-profile data (such as today's plan count) is
   * kept under. Stable for a person; changes when they log in or out.
   */
  profileKey: string;
  register: (input: RegisterInput) => Promise<RegisterResult>;
  login: (input: LoginInput) => Promise<LoginResult>;
  logout: () => Promise<void>;
  /** False when the browser would not keep the guest profile. */
  continueAsGuest: () => Promise<boolean>;
  deleteLocalAccount: () => Promise<boolean>;
}

/** The profile of someone who has neither signed in nor continued as guest. */
export const VISITOR_KEY = "guest:visitor";

export function isGuestKey(key: string): boolean {
  return key.startsWith("guest:");
}

const FALLBACK: AccountContextValue = {
  status: "ready",
  identity: { kind: "none" },
  profileKey: VISITOR_KEY,
  register: async () => ({ ok: false, reason: "storage" }),
  login: async () => ({ ok: false, reason: "storage" }),
  logout: async () => {},
  continueAsGuest: async () => false,
  deleteLocalAccount: async () => false,
};

const AccountContext = createContext<AccountContextValue>(FALLBACK);

export function useAccount(): AccountContextValue {
  return useContext(AccountContext);
}

interface LocalIdentity {
  user: AccountUser | null;
  /** The guest profile id, or null when there is none. */
  guestId: string | null;
}

const SIGNED_OUT: LocalIdentity = { user: null, guestId: null };

interface AccountProviderProps {
  /** Tests pass a backend; the app opens IndexedDB or localStorage itself. */
  backend?: KvBackend | undefined;
  children: ReactNode;
}

export function AccountProvider({ backend, children }: AccountProviderProps) {
  const [local, setLocal] = useState<LocalIdentity>(SIGNED_OUT);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const serviceRef = useRef<Promise<AccountService> | null>(null);

  const getService = useCallback((): Promise<AccountService> => {
    serviceRef.current ??= (
      backend ? Promise.resolve(backend) : openBackend()
    ).then((kv) => createLocalPreviewService(kv));
    return serviceRef.current;
  }, [backend]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const service = await getService();
      const user = await service.currentUser();
      const guest = user ? null : await service.currentGuest();
      if (cancelled) return;
      setLocal({ user, guestId: guest?.id ?? null });
      setStatus("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [getService]);

  const register = useCallback(
    async (input: RegisterInput) => (await getService()).register(input),
    [getService],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const result = await (await getService()).login(input);
      if (result.ok) setLocal({ user: result.user, guestId: null });
      return result;
    },
    [getService],
  );

  const logout = useCallback(async () => {
    const service = await getService();
    await service.logout();
    setLocal({
      user: null,
      guestId: (await service.currentGuest())?.id ?? null,
    });
  }, [getService]);

  const continueAsGuest = useCallback(async () => {
    const profile = await (await getService()).startGuest();
    if (!profile) return false;
    setLocal((current) => ({ ...current, guestId: profile.id }));
    return true;
  }, [getService]);

  const deleteLocalAccount = useCallback(async () => {
    const removed = await (await getService()).deleteLocalData();
    setLocal(SIGNED_OUT);
    return removed;
  }, [getService]);

  const identity = useMemo<Identity>(() => {
    if (local.user) {
      const name = local.user.firstName;
      return {
        kind: "preview",
        name,
        initials: getInitials(`${name} ${local.user.lastName}`),
      };
    }
    return local.guestId ? { kind: "guest" } : { kind: "none" };
  }, [local]);

  const profileKey = local.user
    ? `user:${local.user.id}`
    : local.guestId
      ? `guest:${local.guestId}`
      : VISITOR_KEY;

  const value = useMemo<AccountContextValue>(
    () => ({
      status,
      identity,
      profileKey,
      register,
      login,
      logout,
      continueAsGuest,
      deleteLocalAccount,
    }),
    [
      status,
      identity,
      profileKey,
      register,
      login,
      logout,
      continueAsGuest,
      deleteLocalAccount,
    ],
  );

  return <AccountContext value={value}>{children}</AccountContext>;
}
