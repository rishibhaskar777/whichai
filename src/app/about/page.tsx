import type { Metadata } from "next";
import { AboutContent } from "@/components/content/AboutContent";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("about.title"), alternates: { canonical: "/about" } };
}

export default function Page() {
  return <AboutContent />;
}
