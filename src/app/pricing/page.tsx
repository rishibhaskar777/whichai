import type { Metadata } from "next";
import { PricingView } from "@/components/pricing/PricingView";
import { getI18n } from "@/lib/i18n/server";
import { getCurrentPlan } from "@/lib/pricing/current-plan";
import { parseBilling } from "@/lib/pricing/query";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("pricing.title"),
    description: t("pricing.description"),
    alternates: { canonical: "/pricing" },
  };
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
  const billing = parseBilling(await searchParams);
  return <PricingView billing={billing} currentPlan={getCurrentPlan()} />;
}
