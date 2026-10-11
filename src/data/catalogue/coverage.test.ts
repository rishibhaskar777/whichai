import { describe, expect, it } from "vitest";
import { interpretGoal } from "@/lib/plan/interpret-goal";
import { tokenizePhrase } from "@/lib/plan/text-match";
import { CUSTOM_GOAL_ID, JOB_STAGES } from "@/lib/schemas/catalogue";
import { catalogue } from "./index";

describe("goal coverage", () => {
  it("has about forty goals to choose from, plus the plan built from parts", () => {
    const goals = catalogue.goals.filter((goal) => goal.id !== CUSTOM_GOAL_ID);
    expect(goals.length).toBeGreaterThanOrEqual(40);
    expect(catalogue.goals.some((goal) => goal.id === CUSTOM_GOAL_ID)).toBe(
      true,
    );
  });

  it("gives every goal 15 to 30 keywords and synonyms", () => {
    for (const goal of catalogue.goals) {
      const count = goal.keywords.length + goal.synonyms.length;
      expect(count, goal.id).toBeGreaterThanOrEqual(15);
      expect(count, goal.id).toBeLessThanOrEqual(30);
    }
  });

  it("gives every goal a jobs list for each of the three levels", () => {
    for (const goal of catalogue.goals) {
      for (const level of ["simple", "polished", "advanced"] as const) {
        const jobs = goal.levels[level].jobs;
        if (goal.id === CUSTOM_GOAL_ID || goal.id === "pick-an-ai") {
          // These take their jobs from the parts a person names.
          expect(jobs, `${goal.id} ${level}`).toEqual([]);
        } else {
          expect(jobs.length, `${goal.id} ${level}`).toBeGreaterThanOrEqual(2);
        }
        expect(goal.levels[level].steps.length).toBeGreaterThanOrEqual(3);
        expect(goal.levels[level].commonMistakes.length).toBeGreaterThan(0);
        expect(goal.levels[level].whenToUpgrade.length).toBeGreaterThan(0);
      }
    }
  });

  it("gives each goal's levels a rising number of jobs", () => {
    for (const goal of catalogue.goals) {
      const { simple, polished, advanced } = goal.levels;
      expect(polished.jobs.length, goal.id).toBeGreaterThanOrEqual(
        simple.jobs.length,
      );
      expect(advanced.jobs.length, goal.id).toBeGreaterThanOrEqual(
        simple.jobs.length,
      );
    }
  });

  it("keeps every keyword phrase meaningful once filler words are dropped", () => {
    for (const goal of catalogue.goals) {
      for (const phrase of [...goal.keywords, ...goal.synonyms]) {
        expect(tokenizePhrase(phrase).length, `${goal.id}: ${phrase}`).toBe(
          tokenizePhrase(phrase).filter(Boolean).length,
        );
        expect(
          tokenizePhrase(phrase).length,
          `${goal.id}: "${phrase}" has no words left`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("does not list the same keyword twice in one goal", () => {
    for (const goal of catalogue.goals) {
      const phrases = [...goal.keywords, ...goal.synonyms].map((phrase) =>
        tokenizePhrase(phrase).join(" "),
      );
      const repeated = phrases.filter(
        (phrase, index) => phrases.indexOf(phrase) !== index,
      );
      expect(repeated, goal.id).toEqual([]);
    }
  });
});

describe("job triggers", () => {
  it("gives every job 20 to 40 trigger words and phrases", () => {
    for (const job of catalogue.jobs) {
      expect(job.keywords.length, job.id).toBeGreaterThanOrEqual(20);
      expect(job.keywords.length, job.id).toBeLessThanOrEqual(40);
    }
  });

  it("puts every job at a stage of a project", () => {
    for (const job of catalogue.jobs) {
      expect(JOB_STAGES, job.id).toContain(job.stage);
    }
  });

  it("recognises payments by the words people use", () => {
    const payments = catalogue.jobs.find((job) => job.id === "payments-india")!;
    for (const word of [
      "payment",
      "checkout",
      "razorpay",
      "upi",
      "subscription",
    ]) {
      expect(payments.keywords.some((keyword) => keyword.includes(word))).toBe(
        true,
      );
    }
    expect(payments.keywords).toContain("buy now");
  });
});

describe("common Indian English and short forms", () => {
  it.each([
    ["ppt", "presentation"],
    ["yt video", "make-a-video"],
    ["resume banao", "resume-and-job-search"],
    ["clg project report", "thesis"],
    ["exam ki tayyari", "exam-preparation"],
    ["insta reels ideas", "social-media-content"],
    ["pdf ka summary", "summarise-pdfs"],
  ])("%s -> %s", (text, goalType) => {
    expect(interpretGoal(text)?.goalType).toBe(goalType);
  });
});
