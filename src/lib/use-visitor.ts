"use client";

import { useSyncExternalStore } from "react";
import {
  UNKNOWN_VISITOR,
  detectVisitor,
  type NavigatorSignals,
  type Visitor,
} from "@/lib/platform";

interface UserAgentData {
  platform?: string;
  brands?: readonly { brand: string }[];
}

let cached: Visitor | null = null;

function readSignals(): NavigatorSignals {
  const data = (navigator as Navigator & { userAgentData?: UserAgentData })
    .userAgentData;
  return {
    clientHintPlatform: data?.platform,
    clientHintBrands: data?.brands?.map((entry) => entry.brand),
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
  };
}

function getSnapshot(): Visitor {
  cached ??= detectVisitor(readSignals());
  return cached;
}

const subscribe = () => () => {};

/**
 * The visitor's system and browser, read once on the client. Servers and the
 * first render get an unknown visitor, so the markup always matches.
 */
export function useVisitor(): Visitor {
  return useSyncExternalStore(subscribe, getSnapshot, () => UNKNOWN_VISITOR);
}
