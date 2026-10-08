import { headers } from "next/headers";
import type { ReactNode } from "react";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Reading request headers opts every page into per-request rendering,
  // which Next.js needs in order to apply the CSP nonce to its scripts.
  await headers();

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
