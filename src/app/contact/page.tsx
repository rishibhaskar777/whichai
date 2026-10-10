import type { Metadata } from "next";
import { ContactContent } from "@/components/content/LegalContent";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("contact.title"), alternates: { canonical: "/contact" } };
}

export default function Page() {
  return <ContactContent />;
}
