"use client";

import { useEffect, useRef, useState } from "react";
import { useLocalData } from "@/components/local-data/LocalDataProvider";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { useSaveData } from "@/lib/use-save-data";
import type { AuroraHandle } from "./aurora-engine";
import styles from "./AuroraBackground.module.css";

type Layer = "css" | "canvas";

/** Runs `task` once the page has loaded and the browser has a quiet moment. */
function whenIdle(task: () => void): () => void {
  let cancelled = false;
  let cancelIdle = () => {};
  const run = () => {
    if (cancelled) return;
    if (typeof window.requestIdleCallback === "function") {
      const handle = window.requestIdleCallback(task, { timeout: 3000 });
      cancelIdle = () => window.cancelIdleCallback(handle);
    } else {
      const handle = window.setTimeout(task, 200);
      cancelIdle = () => window.clearTimeout(handle);
    }
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    cancelled = true;
    cancelIdle();
    window.removeEventListener("load", run);
  };
}

/**
 * The page's background light. The CSS glow is always in the markup, so the
 * first paint is the same with or without script. The canvas aurora is loaded
 * after the page is interactive and replaces it when a 2D context is
 * available. Off, reduced motion and save-data draw one still frame.
 */
export function AuroraBackground() {
  const { settings } = useLocalData();
  const reducedMotion = useReducedMotion();
  const saveData = useSaveData();
  const animated = settings.animatedBackground && !reducedMotion && !saveData;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<AuroraHandle | null>(null);
  const animatedRef = useRef(animated);
  const [layer, setLayer] = useState<Layer>("css");

  useEffect(() => {
    animatedRef.current = animated;
    handleRef.current?.setAnimated(animated);
  }, [animated]);

  useEffect(() => {
    let cancelled = false;
    const cancelIdle = whenIdle(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      import("./aurora-engine")
        .then(({ startAurora }) => {
          if (cancelled) return;
          const handle = startAurora(canvas, animatedRef.current);
          if (!handle) return;
          handleRef.current = handle;
          setLayer("canvas");
        })
        .catch(() => {
          // The CSS glow stays in place.
        });
    });
    return () => {
      cancelled = true;
      cancelIdle();
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, []);

  return (
    <div
      className={styles.glow}
      aria-hidden="true"
      data-print-hide=""
      data-layer={layer}
      data-animated={animated ? "true" : "false"}
    >
      <span className={styles.blobOne} />
      <span className={styles.blobTwo} />
      <span className={styles.blobThree} />
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
