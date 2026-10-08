import type { Metadata } from "next";
import { ComingSoon } from "@/components/coming-soon/ComingSoon";

export const metadata: Metadata = {
  title: "Tool Library",
  alternates: { canonical: "/tool-library" },
};

export default function Page() {
  return (
    <ComingSoon
      title="Tool Library"
      description="A browsable library of AI tools, with verified details, is planned for a later release."
    />
  );
}
