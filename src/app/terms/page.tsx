import type { Metadata } from "next";
import { TermsContent } from "@/components/content/LegalContent";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("terms.title"), alternates: { canonical: "/terms" } };
}

export default function Page() {
  return <TermsContent />;
}
