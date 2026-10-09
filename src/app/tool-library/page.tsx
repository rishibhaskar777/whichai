import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon/ComingSoon";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("nav.toolLibrary"),
    alternates: { canonical: "/tool-library" },
  };
}

export default async function Page() {
  const { t } = await getI18n();
  return (
    <ComingSoon
      title={t("nav.toolLibrary")}
      description={t("comingSoon.toolLibrary")}
    />
  );
}
