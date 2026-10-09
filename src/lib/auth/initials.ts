/* Kept apart from session.ts so the sidebar does not bundle the session crypto. */
export function getInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters = words
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("");
  return letters === "" ? "?" : letters.toUpperCase();
}
