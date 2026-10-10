import type { Metadata } from "next";
import { WhatChanged } from "@/components/news/WhatChanged";
import { getI18n } from "@/lib/i18n/server";
import { getNews } from "@/lib/news";
import { parseNewsQuery } from "@/lib/news/query";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("nav.whatChanged"),
    description: t("whatChanged.lede"),
    alternates: { canonical: "/what-changed" },
  };
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
  const i18n = await getI18n();
  const snapshot = await getNews();
  const query = parseNewsQuery(
    await searchParams,
    snapshot.sources.map((source) => source.id),
  );
  return <WhatChanged snapshot={snapshot} query={query} i18n={i18n} />;
}
