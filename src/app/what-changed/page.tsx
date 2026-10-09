import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon/ComingSoon";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("nav.whatChanged"),
    alternates: { canonical: "/what-changed" },
  };
}

export default async function Page() {
  const { t } = await getI18n();
  return (
    <ComingSoon
      title={t("nav.whatChanged")}
      description={t("comingSoon.whatChanged")}
    />
  );
}
