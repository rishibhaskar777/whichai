export interface Suggestion {
  label: string;
  goal: string;
}

export const suggestions: readonly Suggestion[] = [
  { label: "Study plan", goal: "Make a study plan for my upcoming exams" },
  {
    label: "Portfolio website",
    goal: "Build a portfolio website to show my work",
  },
  {
    label: "Reading and stories",
    goal: "Read and write stories with AI help",
  },
  { label: "Resume help", goal: "Improve my resume for a job application" },
  { label: "Make a video", goal: "Make a short video from my own footage" },
  { label: "Build an app", goal: "Build a simple app without much coding" },
];

export const placeholderExamples: readonly string[] = [
  "Make a study plan for my exams",
  "Build a portfolio website",
  "Turn my notes into a short video",
  "Improve my resume for a design job",
  "Build a budgeting app for my phone",
];
