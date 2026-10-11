"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEntitlements } from "@/components/entitlements/EntitlementsProvider";
import { LockedControl } from "@/components/entitlements/LockedControl";
import { requirementFor } from "@/lib/plans/entitlements";

interface CompareLinkProps {
  href: string;
  className?: string | undefined;
  picked?: boolean;
  children: ReactNode;
}

/** A link into Compare that shows a lock to people whose plan does not include it. */
export function CompareLink({
  href,
  className,
  picked,
  children,
}: CompareLinkProps) {
  const { entitlements } = useEntitlements();
  const requirement = requirementFor("compare", entitlements);
  if (requirement !== "none") {
    return (
      <LockedControl requirement={requirement} className={className}>
        {children}
      </LockedControl>
    );
  }
  return (
    <Link
      href={href}
      className={className}
      data-picked={picked ? "true" : undefined}
      prefetch={false}
    >
      {children}
    </Link>
  );
}
