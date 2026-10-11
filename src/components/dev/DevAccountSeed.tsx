"use client";

import { useEffect, useRef } from "react";
import { useAccount } from "@/components/account/AccountProvider";
import type { DevTestAccount } from "@/lib/env";

/*
 * Development only. Creates the account from .env.local the first time the
 * app loads in a browser, hashed like any other. It does not log in.
 */
export function DevAccountSeed({ account }: { account: DevTestAccount }) {
  const { register, status } = useAccount();
  const done = useRef(false);

  useEffect(() => {
    if (status !== "ready" || done.current) return;
    done.current = true;
    void register({
      email: account.email,
      password: account.password,
      firstName: "Dev",
      lastName: "Tester",
      terms: true,
    }).then((result) => {
      if (!result.ok && result.reason === "invalid") {
        console.warn(
          "The development test account was not created: the password failed the sign-up rules.",
        );
      }
    });
  }, [account, register, status]);

  return null;
}
