import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ToolDetail } from "@/components/tools/ToolDetail";
import { catalogue } from "@/data/catalogue";
import { getI18n } from "@/lib/i18n/server";
import { toolDetails } from "@/lib/library/tool-details";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = true;

export function generateStaticParams() {
  return catalogue.tools.map((tool) => ({ id: tool.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const details = toolDetails(id, catalogue);
  if (!details) return { title: "Not found" };
  const { tool } = details;
  const path = `/tools/${tool.id}`;
  return {
    title: tool.name,
    description: tool.summary,
    alternates: { canonical: path },
    openGraph: { title: tool.name, description: tool.summary, url: path },
  };
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const details = toolDetails(id, catalogue);
  if (!details) notFound();
  return <ToolDetail details={details} i18n={await getI18n()} />;
}
