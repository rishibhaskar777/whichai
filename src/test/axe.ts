import axe from "axe-core";

export async function seriousViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.filter(
    (violation) =>
      violation.impact === "serious" || violation.impact === "critical",
  );
}

export async function headingViolations(container: Element) {
  const results = await axe.run(container, {
    runOnly: ["heading-order", "empty-heading"],
  });
  return results.violations;
}
