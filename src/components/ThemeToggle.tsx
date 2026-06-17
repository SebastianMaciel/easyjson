"use client";

import { MoonIcon, SunIcon } from "./icons";
import styles from "./ThemeToggle.module.css";

type Props = {
  theme: "light" | "dark";
  onToggle: () => void;
};

export default function ThemeToggle({ theme, onToggle }: Props) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      data-tooltip={isDark ? "Switch to light mode" : "Switch to dark mode"}
      data-tooltip-pos="bottom"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
