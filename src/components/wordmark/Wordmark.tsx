import styles from "./Wordmark.module.css";

interface WordmarkProps {
  showName?: boolean;
}

export function Wordmark({ showName = true }: WordmarkProps) {
  return (
    <span className={styles.wordmark}>
      <svg
        className={styles.mark}
        viewBox="0 0 32 32"
        width="32"
        height="32"
        aria-hidden="true"
        focusable="false"
      >
        <rect width="32" height="32" rx="9" className={styles.tile} />
        <g className={styles.branches}>
          <path d="M16 25v-10M16 15 9 8M16 15V7M16 15l7-7" />
        </g>
        <g className={styles.nodes}>
          <circle cx="9" cy="8" r="2" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="23" cy="8" r="2" />
        </g>
      </svg>
      {showName ? (
        <span className={styles.name}>
          Which<span className={styles.accent}>AI</span>
        </span>
      ) : (
        <span className={styles.visuallyHidden}>WhichAI</span>
      )}
    </span>
  );
}
