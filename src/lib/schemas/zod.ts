import { z } from "zod";

// Zod probes for eval support with new Function(), which the CSP blocks and
// reports as a violation. Skipping the probe keeps the browser console clean.
z.config({ jitless: true });

export { z };
