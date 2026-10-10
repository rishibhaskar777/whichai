import { permanentRedirect } from "next/navigation";

/** The Tool Library moved to /tools. Old links keep working. */
export default function Page() {
  permanentRedirect("/tools");
}
