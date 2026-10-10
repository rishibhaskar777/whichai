import type { Metadata } from "next";
import { RefundContent } from "@/components/content/LegalContent";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("refund.title"),
    alternates: { canonical: "/refund-policy" },
  };
}

export default function Page() {
  return <RefundContent />;
}
