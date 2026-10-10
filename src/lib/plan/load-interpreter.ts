export type Interpreter = typeof import("./interpret-goal");

let loading: Promise<Interpreter> | null = null;

/**
 * Loads the goal interpreter, and with it the catalogue, the first time a
 * person needs it. The home page ships without the catalogue; it arrives as a
 * separate file when the person focuses the search or submits a goal.
 */
export function loadInterpreter(): Promise<Interpreter> {
  loading ??= import("./interpret-goal");
  return loading;
}
