import type { Metadata } from "next";
import { PrivacyContent } from "@/components/content/PrivacyContent";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("privacy.title"), alternates: { canonical: "/privacy" } };
}

export default function Page() {
  return <PrivacyContent />;
}
