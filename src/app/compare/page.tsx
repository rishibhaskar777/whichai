import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CompareView } from "@/components/tools/CompareView";
import { catalogue } from "@/data/catalogue";
import { getI18n } from "@/lib/i18n/server";
import {
  compareHref,
  parseCompareSelection,
  resolveTool,
} from "@/lib/library/compare";
import { MAX_COMPARE } from "@/lib/library/query";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("compare.title"),
    description: t("compare.description"),
    alternates: { canonical: "/compare" },
  };
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const selected = parseCompareSelection(params["tools"], catalogue.tools);

  // The add form sends the typed name. Resolve it, then keep a clean URL.
  const rawAdd = params["add"];
  const typed = (Array.isArray(rawAdd) ? rawAdd[0] : rawAdd)?.slice(0, 80);
  let unmatched: string | null = null;
  if (typed && typed.trim()) {
    const found = resolveTool(typed, catalogue.tools);
    if (
      found &&
      !selected.includes(found.id) &&
      selected.length < MAX_COMPARE
    ) {
      redirect(compareHref([...selected, found.id]));
    }
    if (!found) unmatched = typed.trim();
  }

  return (
    <CompareView
      catalogue={catalogue}
      selected={selected}
      unmatched={unmatched}
      i18n={await getI18n()}
    />
  );
}
