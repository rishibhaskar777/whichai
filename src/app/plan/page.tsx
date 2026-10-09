import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanRoute } from "@/components/plan-route/PlanRoute";

export const metadata: Metadata = {
  title: "Plan",
  robots: { index: false },
  alternates: { canonical: "/plan" },
};

export default function Page() {
  return (
    <Suspense>
      <PlanRoute />
    </Suspense>
  );
}
