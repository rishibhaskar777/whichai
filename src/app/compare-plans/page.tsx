import { permanentRedirect } from "next/navigation";

/** Comparison moved to /compare. Old links keep working. */
export default function Page() {
  permanentRedirect("/compare");
}
