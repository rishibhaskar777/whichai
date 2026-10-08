import type { Metadata } from "next";
import { GoalForm } from "@/components/goal-form/GoalForm";
import styles from "./page.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <div className={styles.home}>
      <div className={styles.intro}>
        <h1 className={styles.greeting}>What do you want to do with AI?</h1>
        <p className={styles.lead}>
          Describe your goal. WhichAI suggests which AI tools to use and how to
          use them, at three levels: Simple, Polished and Advanced.
        </p>
      </div>
      <GoalForm />
    </div>
  );
}
