import { describe, expect, it } from "vitest";
import { catalogue } from "@/data/catalogue";
import { buildPlan } from "@/lib/engine/build-plan";
import { GOAL_IDS } from "@/lib/schemas/catalogue";
import { planSchema, understoodGoalSchema } from "@/lib/schemas/plan";
import { taskJobIdOf } from "./chips";
import {
  addableChips,
  coveredGoals,
  inferLevel,
  interpretGoal,
} from "./interpret-goal";

function labels(goal: ReturnType<typeof interpretGoal>) {
  return goal?.chips.map((chip) => chip.label);
}

function tasks(goal: ReturnType<typeof interpretGoal>) {
  return goal?.chips.flatMap((chip) => taskJobIdOf(chip) ?? []);
}

describe("interpretGoal: portfolio and study goals", () => {
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
    expect(interpretGoal("exams portfolio")?.goalType).toBe("study-plan");
    expect(interpretGoal("portfolio exams")?.goalType).toBe(
      "portfolio-website",
    );
  });

  it("does not match keywords inside longer words", () => {
    expect(interpretGoal("I love the opposite of a bathroom")).toBeNull();
    expect(interpretGoal("a studio apartment")).toBeNull();
  });
});

describe("interpretGoal: every goal in the catalogue", () => {
  it.each([
    ["Improve my resume for a job application", "resume-and-job-search"],
    ["Write a cover letter for an internship", "resume-and-job-search"],
    ["Make a short video from my own footage", "make-a-video"],
    ["I want to start a YouTube channel", "make-a-video"],
    ["Build a todo app with login", "build-an-app"],
    ["Build a simple app without much coding", "build-an-app"],
    ["Research ancient Indian stories", "research-and-reading"],
    ["Read and write stories with AI help", "research-and-reading"],
    ["Build a website for my small business", "business-website"],
    ["I want an online store for my shop", "business-website"],
    ["Make a presentation for my project", "presentation"],
    ["I need a pitch deck", "presentation"],
    ["Which AI should I use to summarise a PDF?", "pick-an-ai"],
  ] as const)("%s -> %s", (text, goalType) => {
    expect(interpretGoal(text)?.goalType).toBe(goalType);
  });

  it("recognises each goal template by its own example", () => {
    for (const goal of coveredGoals) {
      expect(interpretGoal(goal.example)?.goalType, goal.example).toBe(
        goal.goalType,
      );
    }
  });

  it("lists every goal it covers", () => {
    expect(coveredGoals.map((goal) => goal.goalType).sort()).toEqual(
      [...GOAL_IDS].sort(),
    );
    expect(coveredGoals.map((goal) => goal.title)).toContain(
      "Portfolio website",
    );
    expect(coveredGoals.map((goal) => goal.title)).toContain("Study plan");
  });

  it("prefers a business site over a portfolio when business words are present", () => {
    expect(interpretGoal("a website for my business")?.goalType).toBe(
      "business-website",
    );
  });

  it("builds a valid plan for whatever it understands", () => {
    for (const goal of coveredGoals) {
      const understood = interpretGoal(goal.example);
      expect(understood).not.toBeNull();
      const plan = buildPlan(understood!, {
        level: understood!.inferredLevel,
        budget: null,
        toolsUsed: new Set(),
      });
      expect(planSchema.safeParse(plan).success).toBe(true);
    }
  });
});

describe("interpretGoal: synonyms", () => {
  it.each([
    ["my curriculum vitae", "resume-and-job-search"],
    ["help me get hired", "resume-and-job-search"],
    ["prepare for the board exams", "study-plan"],
    ["JEE preparation", "study-plan"],
    ["make a reel", "make-a-video"],
    ["explainer video", "make-a-video"],
    ["a side project idea", "build-an-app"],
    ["tell me about the Mahabharata", "research-and-reading"],
    ["a talk for my seminar", "presentation"],
    ["a website for my restaurant", "business-website"],
  ] as const)("%s -> %s", (text, goalType) => {
    expect(interpretGoal(text)?.goalType).toBe(goalType);
  });
});

describe("interpretGoal: typos", () => {
  it.each([
    ["portfolo website", "portfolio-website"],
    ["porfolio", "portfolio-website"],
    ["studdy plan for exmas", "study-plan"],
    ["improve my resumee", "resume-and-job-search"],
    ["presentaton for class", "presentation"],
    ["buisness website", "business-website"],
    ["reserach ancient stories", "research-and-reading"],
    ["make a vedio for youtub", "make-a-video"],
  ] as const)("%s -> %s", (text, goalType) => {
    expect(interpretGoal(text)?.goalType).toBe(goalType);
  });

  it("does not turn unrelated short words into matches", () => {
    expect(interpretGoal("sit on the mat")).toBeNull();
    expect(interpretGoal("cat car cab")).toBeNull();
  });
});

describe("interpretGoal: tasks without a goal", () => {
  it.each([
    ["make a logo", ["image-generation", "design-tool"]],
    ["summarise a pdf", ["research-with-sources", "ai-assistant"]],
    ["edit a video", ["video-editing"]],
    ["transcribe my lecture audio", ["voice-and-audio"]],
    ["fix a bug in my script", ["coding-assistant"]],
    ["design a poster", ["design-tool", "image-generation"]],
  ])("%s", (text, jobs) => {
    const goal = interpretGoal(text);
    expect(goal?.goalType).toBe("pick-an-ai");
    expect(goal?.title).toBe("Pick the right AI for a task");
    expect([...(tasks(goal) ?? [])].sort()).toEqual([...jobs].sort());
  });

  it("names the task chips after the jobs", () => {
    expect(labels(interpretGoal("edit a video"))).toEqual([
      "Pick the right AI for a task",
      "Video editing",
    ]);
  });

  it("tolerates typos in task words", () => {
    expect(tasks(interpretGoal("find citatons for my essay"))).toContain(
      "research-with-sources",
    );
    expect(interpretGoal("edit a vidio")?.goalType).toBe("pick-an-ai");
  });

  it("limits how many tasks it takes from a long wish list", () => {
    const goal = interpretGoal(
      "logo video editing voiceover slides resume quiz database hosting analytics",
    );
    expect(tasks(goal)?.length).toBeLessThanOrEqual(4);
  });

  it("adds the tasks it hears to an explicit request for tool help", () => {
    const goal = interpretGoal("which ai is best to make a logo");
    expect(goal?.goalType).toBe("pick-an-ai");
    expect(tasks(goal)).toContain("design-tool");
  });

  it("returns the generic goal with no tasks when only the request is understood", () => {
    const goal = interpretGoal("which ai should I use");
    expect(goal?.goalType).toBe("pick-an-ai");
    expect(tasks(goal)).toEqual([]);
  });

  it("builds a plan from the tasks", () => {
    const goal = interpretGoal("make a logo")!;
    const plan = buildPlan(goal, {
      level: "simple",
      budget: null,
      toolsUsed: new Set(),
    });
    expect(plan.levels.simple.jobs.map((job) => job.jobId).sort()).toEqual([
      "design-tool",
      "image-generation",
    ]);
  });
});

describe("interpretGoal: no match and odd input", () => {
  it.each([
    "",
    "   ",
    "\n\t",
    "?",
    "!!!",
    "a",
    "😀😀😀",
    "the weather in Delhi today",
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

  it("stays quick on the longest allowed input", () => {
    const started = performance.now();
    interpretGoal(
      "portfolio website with animations ".repeat(15).slice(0, 500),
    );
    expect(performance.now() - started).toBeLessThan(500);
  });
});

describe("interpretGoal: features", () => {
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

  it("detects the features of each goal", () => {
    expect(labels(interpretGoal("todo app with login and payments"))).toEqual([
      "Build an app",
      "Login",
      "Payments",
    ]);
    expect(
      labels(interpretGoal("youtube video with a thumbnail and voiceover")),
    ).toEqual(["Make a video", "Voiceover", "Thumbnail"]);
    expect(labels(interpretGoal("resume and a cover letter"))).toContain(
      "Cover letter",
    );
  });

  it.each([
    ["animated hero on my site", "Animation"],
    ["a site with a CONTACT-FORM", "Contact form"],
    ["a site with a contact me form", "Contact form"],
    ["a site in dark-theme", "Dark mode"],
    ["a site with blogging", "Blog"],
    ["a site with animashun", null],
    ["a site with animations", "Animation"],
  ])("recognises variants: %s", (text, label) => {
    if (label) expect(labels(interpretGoal(text))).toContain(label);
    else expect(labels(interpretGoal(text))).toEqual(["Portfolio website"]);
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

  it("offers the features of the goal for adding", () => {
    expect(addableChips("portfolio-website").map((chip) => chip.label)).toEqual(
      ["Animation", "Blog", "Contact form", "Dark mode", "Analytics"],
    );
    expect(addableChips("study-plan").map((chip) => chip.label)).toEqual([
      "Notes",
      "Quiz",
      "Research",
    ]);
  });

  it("offers the tasks themselves for the generic goal, without build jobs", () => {
    const options = addableChips("pick-an-ai");
    expect(options.map((chip) => chip.label)).toContain("Design tool");
    expect(options.map((chip) => chip.label)).not.toContain("Hosting");
  });

  it("every addable chip can be built into a plan", () => {
    for (const goal of catalogue.goals) {
      const chips = addableChips(goal.id);
      const understood = {
        goalType: goal.id,
        title: goal.title,
        chips: [
          { id: `goal:${goal.id}`, label: goal.title, kind: "goal" as const },
          ...chips.slice(0, 4),
        ],
        inferredLevel: "simple" as const,
      };
      expect(() =>
        buildPlan(understood, {
          level: "simple",
          budget: null,
          toolsUsed: new Set(),
        }),
      ).not.toThrow();
    }
  });
});

describe("interpretGoal: skills and level", () => {
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
