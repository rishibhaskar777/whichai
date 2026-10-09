import type { MessageKey } from "@/lib/i18n/en";

export interface Suggestion {
  labelKey: MessageKey;
  /* Stays in English: the goal interpreter reads English keywords. */
  goal: string;
}

export const suggestions: readonly Suggestion[] = [
  {
    labelKey: "suggest.study",
    goal: "Make a study plan for my upcoming exams",
  },
  {
    labelKey: "suggest.portfolio",
    goal: "Build a portfolio website to show my work",
  },
  {
    labelKey: "suggest.reading",
    goal: "Read and write stories with AI help",
  },
  {
    labelKey: "suggest.resume",
    goal: "Improve my resume for a job application",
  },
  {
    labelKey: "suggest.video",
    goal: "Make a short video from my own footage",
  },
  {
    labelKey: "suggest.app",
    goal: "Build a simple app without much coding",
  },
];

export const placeholderExamples: readonly string[] = [
  "Make a study plan for my exams",
  "Build a portfolio website",
  "Turn my notes into a short video",
  "Improve my resume for a design job",
  "Build a budgeting app for my phone",
];
