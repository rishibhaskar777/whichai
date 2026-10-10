import type { NewsTag } from "@/lib/news/types";
import styles from "./News.module.css";

interface TagLabelProps {
  tag: NewsTag;
  label: string;
}

/** A coloured dot and the tag's name; the name is what carries the meaning. */
export function TagLabel({ tag, label }: TagLabelProps) {
  return (
    <span className={styles.tag}>
      <span className={styles.dot} data-tag={tag} aria-hidden="true" />
      {label}
    </span>
  );
}
