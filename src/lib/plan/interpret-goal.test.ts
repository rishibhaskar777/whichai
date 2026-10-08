import { describe, expect, it } from "vitest";
import { understoodGoalSchema } from "@/lib/schemas/plan";
import {
  coveredGoals,
  featureOptions,
  inferLevel,
  interpretGoal,
} from "./interpret-goal";

function labels(goal: ReturnType<typeof interpretGoal>) {
  return goal?.chips.map((chip) => chip.label);
}

describe("interpretGoal goal types", () => {
  it.each([
    "Build a portfolio website to show my work",
    "I need a personal site",
    "make me a portfolio",
    "create a website for my photography",
  ])("recognises a portfolio website: %s", (text) => {
    expect(interpretGoal(text)?.goalType).toBe("portfolio-website");
  });

  it.each([
    "Make a study plan for my upcoming exams",
    "I want to learn organic chemistry",
    "help me with my syllabus",
    "studying for the bar exam",
  ])("recognises a study plan: %s", (text) => {
    expect(interpretGoal(text)?.goalType).toBe("study-plan");
  });

  it("returns a goal chip first, with the goal title", () => {
    const goal = interpretGoal("Build a portfolio website");
    expect(goal?.title).toBe("Portfolio website");
    expect(goal?.chips[0]).toEqual({
      id: "goal:portfolio-website",
      label: "Portfolio website",
      kind: "goal",
    });
  });

  it("is not thrown off by capitalisation or punctuation", () => {
    expect(interpretGoal("PORTFOLIO!!!")?.goalType).toBe("portfolio-website");
    expect(interpretGoal("pOrTfOlIo WeBsItE")?.goalType).toBe(
      "portfolio-website",
    );
    expect(interpretGoal("...EXAMS?!...")?.goalType).toBe("study-plan");
  });

  it("prefers the goal with more matching keywords", () => {
    expect(
      interpretGoal("Build a portfolio site to learn React")?.goalType,
    ).toBe("portfolio-website");
  });

  it("breaks a tie by the keyword mentioned first", () => {
    expect(interpretGoal("study a website")?.goalType).toBe("study-plan");
    expect(interpretGoal("website study")?.goalType).toBe("portfolio-website");
  });

  it("does not match keywords inside longer words", () => {
    expect(interpretGoal("I love the opposite of a bathroom")).toBeNull();
    expect(interpretGoal("a studio apartment")).toBeNull();
    expect(interpretGoal("learnt")).toBeNull();
  });

  it("lists the goals it covers", () => {
    expect(coveredGoals.map((goal) => goal.title)).toEqual([
      "Portfolio website",
      "Study plan",
    ]);
  });
});

describe("interpretGoal no-match and odd input", () => {
  it.each([
    "",
    "   ",
    "\n\t",
    "?",
    "!!!",
    "a",
    "Make a short video from my footage",
    "Improve my resume for a job application",
    "😀😀😀",
  ])("returns null for %j", (text) => {
    expect(interpretGoal(text)).toBeNull();
  });

  it("handles long input without matching anything", () => {
    expect(interpretGoal("x ".repeat(250))).toBeNull();
  });

  it("handles multi-line input", () => {
    expect(interpretGoal("first line\nmy portfolio\nthird")?.goalType).toBe(
      "portfolio-website",
    );
  });
});

describe("interpretGoal features", () => {
  it("adds only the features that are mentioned", () => {
    const goal = interpretGoal(
      "Portfolio website with animations, a blog, a contact form and dark mode",
    );
    expect(labels(goal)).toEqual([
      "Portfolio website",
      "Animation",
      "Blog",
      "Contact form",
      "Dark mode",
    ]);
  });

  it("adds no features when none are mentioned", () => {
    expect(labels(interpretGoal("Build a portfolio website"))).toEqual([
      "Portfolio website",
    ]);
  });

  it("recognises notes and quizzes for study goals", () => {
    const goal = interpretGoal("Study for exams with notes and quizzes");
    expect(labels(goal)).toEqual(["Study plan", "Notes", "Quiz"]);
  });

  it.each([
    ["animated hero on my site", "Animation"],
    ["a site with a CONTACT-FORM", "Contact form"],
    ["a site with a contact me form", "Contact form"],
    ["a site in dark-theme", "Dark mode"],
    ["a site with blogging", "Blog"],
  ])("recognises variants: %s", (text, label) => {
    expect(labels(interpretGoal(text))).toContain(label);
  });

  it("does not treat a bare contact mention as a contact form", () => {
    expect(labels(interpretGoal("a site to contact recruiters"))).toEqual([
      "Portfolio website",
    ]);
  });

  it("marks feature chips with the feature kind and unique ids", () => {
    const goal = interpretGoal("site with a blog and animation");
    const features = goal?.chips.filter((chip) => chip.kind === "feature");
    expect(features).toHaveLength(2);
    expect(new Set(goal?.chips.map((chip) => chip.id)).size).toBe(
      goal?.chips.length,
    );
  });

  it("offers the six feature chips for adding", () => {
    expect(featureOptions.map((chip) => chip.label)).toEqual([
      "Animation",
      "Blog",
      "Contact form",
      "Dark mode",
      "Notes",
      "Quiz",
    ]);
  });
});

describe("interpretGoal skills and level", () => {
  it("defaults to the simple level", () => {
    expect(interpretGoal("Build a portfolio website")?.inferredLevel).toBe(
      "simple",
    );
  });

  it.each([
    ["Portfolio website, I know Git", "polished"],
    ["Portfolio site on GitHub", "polished"],
    ["a site I can deploy", "polished"],
    ["Portfolio in React", "advanced"],
    ["Portfolio site with Next.js", "advanced"],
    ["portfolio with NEXTJS", "advanced"],
    ["portfolio with next js", "advanced"],
    ["portfolio site calling an API", "advanced"],
  ] as const)("infers the level for %s", (text, level) => {
    expect(interpretGoal(text)?.inferredLevel).toBe(level);
  });

  it("uses the highest level when several skills are mentioned", () => {
    const goal = interpretGoal("portfolio with Git, deploy and React");
    expect(goal?.inferredLevel).toBe("advanced");
    expect(labels(goal)).toEqual([
      "Portfolio website",
      "React",
      "Git",
      "Deploying",
    ]);
  });

  it("does not read the verb react as a skill", () => {
    expect(
      labels(interpretGoal("a site where visitors react to my posts")),
    ).toEqual(["Portfolio website"]);
  });

  it("recomputes the level from the chips that remain", () => {
    const goal = interpretGoal("portfolio with Git and React");
    expect(goal).not.toBeNull();
    const chips = goal?.chips ?? [];
    expect(inferLevel(chips)).toBe("advanced");
    expect(inferLevel(chips.filter((chip) => chip.id !== "skill:react"))).toBe(
      "polished",
    );
    expect(inferLevel(chips.filter((chip) => chip.kind !== "skill"))).toBe(
      "simple",
    );
  });

  it("returns a result that satisfies the schema", () => {
    const goal = interpretGoal("Portfolio website with a blog, built in React");
    expect(understoodGoalSchema.safeParse(goal).success).toBe(true);
  });
});
