import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon/ComingSoon";

export const metadata: Metadata = { title: "What Changed" };

export default function Page() {
  return (
    <ComingSoon
      title="What Changed"
      description="A log of verified changes to AI tools and plans is planned for a later release."
    />
  );
}
