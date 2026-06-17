"use client";

import { useMemo, useState } from "react";
import { type JSONValue, highlightJSON, pretty } from "@/lib/json";
import styles from "./RawView.module.css";

type Props = {
  data: JSONValue;
};

export default function RawView({ data }: Props) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => pretty(data), [data]);
  const html = useMemo(() => highlightJSON(text), [text]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard API unavailable; no-op
    }
  };

  const byteSize = useMemo(() => new Blob([text]).size, [text]);
  const lineCount = useMemo(() => text.split("\n").length, [text]);

  return (
    <div className={styles.wrap}>
      <div className={styles.toolbar}>
        <span className={styles.meta}>
          {lineCount} {lineCount === 1 ? "line" : "lines"} · {formatBytes(byteSize)} · read-only
        </span>
        <button type="button" className={styles.copyBtn} onClick={copy}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre
        className={styles.code}
        dangerouslySetInnerHTML={{ __html: html }}
        aria-label="JSON raw view"
      />
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
