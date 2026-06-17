"use client";

import { useCallback, useRef, useState } from "react";
import type { JSONValue } from "@/lib/json";
import styles from "./Uploader.module.css";

type Props = {
  onLoad: (data: JSONValue, filename: string) => void;
};

export default function Uploader({ onLoad }: Props) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        setError(null);
        onLoad(data, file.name);
      } catch (e) {
        setError(
          e instanceof Error
            ? `Couldn't parse this file as JSON. ${e.message}`
            : "Couldn't parse this file as JSON.",
        );
      }
    },
    [onLoad],
  );

  return (
    <div className={styles.wrap}>
      <div
        role="button"
        tabIndex={0}
        className={`${styles.dropzone} ${drag ? styles.dragging : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          accept(e.dataTransfer.files[0]);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json,text/plain"
          className={styles.input}
          onChange={(e) => accept(e.target.files?.[0])}
        />
        <div className={styles.icon} aria-hidden="true">{ }</div>
        <h1 className={styles.title}>Drop a JSON file here</h1>
        <p className={styles.sub}>or click anywhere in this box to pick one</p>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </div>

      <div className={styles.divider}>
        <span>or</span>
      </div>

      <div className={styles.startFresh}>
        <button
          type="button"
          className={styles.startBtn}
          onClick={() => onLoad({}, "untitled.json")}
        >
          Start with empty object{" "}
          <span className={styles.startMono}>{"{}"}</span>
        </button>
        <button
          type="button"
          className={styles.startBtnAlt}
          onClick={() => onLoad([], "untitled.json")}
        >
          Start with empty array{" "}
          <span className={styles.startMono}>{"[]"}</span>
        </button>
      </div>
    </div>
  );
}
