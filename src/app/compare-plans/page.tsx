import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon/ComingSoon";

export const metadata: Metadata = { title: "Compare Plans" };

export default function Page() {
  return (
    <ComingSoon
      title="Compare Plans"
      description="Side-by-side comparison of plans from different tools is planned for a later release."
    />
  );
}
