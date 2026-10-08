import type { Metadata } from "next";
import { HomeFlow } from "@/components/home-flow/HomeFlow";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeFlow />;
}
