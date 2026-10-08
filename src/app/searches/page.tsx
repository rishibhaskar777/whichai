import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon/ComingSoon";

export const metadata: Metadata = { title: "Searches" };

export default function Page() {
  return (
    <ComingSoon
      title="Searches"
      description="Your past searches will be listed here once accounts are available."
    />
  );
}
