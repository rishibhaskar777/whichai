import type { Metadata } from "next";
import { Library } from "@/components/tools/Library";
import { catalogue } from "@/data/catalogue";
import { getI18n } from "@/lib/i18n/server";
import { parseLibraryQuery } from "@/lib/library/query";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("library.title"),
    description: t("library.description"),
    alternates: { canonical: "/tools" },
  };
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
  const i18n = await getI18n();
  const query = parseLibraryQuery(await searchParams);
  return <Library catalogue={catalogue} query={query} i18n={i18n} />;
}
