import type { Metadata } from "next";
import { SearchesView } from "@/components/searches/SearchesView";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.searches"), alternates: { canonical: "/searches" } };
}

export default function Page() {
  return <SearchesView />;
}
