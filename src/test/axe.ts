import axe from "axe-core";

/*
 * Only the WCAG A and AA rules run, and only violations are collected: the
 * full rule set made each check take seconds. Colour contrast is off because
 * jsdom has no layout or styles; `src/styles/contrast.test.ts` covers it.
 */
const OPTIONS: axe.RunOptions = {
  runOnly: {
    type: "tag",
    values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  },
  rules: { "color-contrast": { enabled: false } },
  resultTypes: ["violations"],
};

export async function seriousViolations(container: Element) {
  const results = await axe.run(container, OPTIONS);
  return results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
}

export async function headingViolations(container: Element) {
  const results = await axe.run(container, {
    runOnly: ["heading-order", "empty-heading"],
    resultTypes: ["violations"],
  });
  return results.violations;
}
