import { useSyncExternalStore } from "react";

interface NetworkInformation extends EventTarget {
  saveData?: boolean;
}

function connection(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation })
    .connection;
}

function subscribe(onChange: () => void) {
  const info = connection();
  info?.addEventListener("change", onChange);
  return () => info?.removeEventListener("change", onChange);
}

/** True when the device or browser asks to save data. */
export function useSaveData(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => connection()?.saveData === true,
    () => false,
  );
}
