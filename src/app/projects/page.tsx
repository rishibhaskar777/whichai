import type { Metadata } from "next";
import { ProjectsView } from "@/components/projects/ProjectsView";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t("nav.projects"), alternates: { canonical: "/projects" } };
}

export default function Page() {
  return <ProjectsView />;
}
