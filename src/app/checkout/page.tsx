import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutView } from "@/components/pricing/CheckoutView";
import { getViewer } from "@/lib/auth/get-session";
import { getI18n } from "@/lib/i18n/server";
import { parseCheckoutQuery } from "@/lib/pricing/query";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("checkout.title"),
    robots: { index: false },
    alternates: { canonical: "/checkout" },
  };
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
  const query = parseCheckoutQuery(await searchParams);
  if (!query) redirect("/pricing");
  const viewer = await getViewer();
  return (
    <CheckoutView
      plan={query.plan}
      billing={query.billing}
      viewerName={viewer?.name ?? null}
    />
  );
}
