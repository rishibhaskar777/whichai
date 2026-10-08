import styles from "./Wordmark.module.css";

interface WordmarkProps {
  showName?: boolean;
}

export function Wordmark({ showName = true }: WordmarkProps) {
  return (
    <span className={styles.wordmark}>
      <svg
        className={styles.mark}
        viewBox="0 0 24 24"
        width="24"
        height="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="2" y="2" width="20" height="20" rx="6" />
        <path d="M12 18v-5M12 13 8 8.5M12 13V8M12 13l4-4.5" />
      </svg>
      {showName ? (
        <span className={styles.name}>WhichAI</span>
      ) : (
        <span className={styles.visuallyHidden}>WhichAI</span>
      )}
    </span>
  );
}
