import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon/ComingSoon";

export const metadata: Metadata = {
  title: "Projects",
  alternates: { canonical: "/projects" },
};

export default function Page() {
  return (
    <ComingSoon
      title="Projects"
      description="Saved plans for each of your projects will live here once accounts are available."
    />
  );
}
