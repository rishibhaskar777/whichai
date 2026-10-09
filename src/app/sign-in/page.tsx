import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignInPanel } from "@/components/sign-in/SignInPanel";
import styles from "@/components/sign-in/SignIn.module.css";
import { getProviderAvailability } from "@/lib/auth/config";
import { parseAuthError } from "@/lib/auth/errors";
import { getSession } from "@/lib/auth/get-session";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
  alternates: { canonical: "/sign-in" },
};

interface PageProps {
  searchParams: Promise<{ error?: string; next?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const query = await searchParams;
  const next = safeRedirectPath(query.next);
  if (await getSession()) redirect(next);

  return (
    <div className={styles.card}>
      <SignInPanel
        providers={getProviderAvailability()}
        next={next}
        headingLevel="h1"
        titleId="sign-in-title"
        error={parseAuthError(query.error)}
      />
    </div>
  );
}
