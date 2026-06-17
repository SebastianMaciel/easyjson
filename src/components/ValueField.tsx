"use client";

import {
  type JSONValue,
  type JSONType,
  defaultValueFor,
  isContainer,
  typeOf,
} from "@/lib/json";
import styles from "./ValueField.module.css";

type Props = {
  value: JSONValue;
  onChange: (v: JSONValue) => void;
  onOpen?: () => void;
  advanced: boolean;
};

export default function ValueField({ value, onChange, onOpen, advanced }: Props) {
  const t = typeOf(value);

  if (t === "string") {
    const s = value as string;
    const isMultiline = s.includes("\n") || s.length > 80;
    if (isMultiline) {
      return (
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={s}
          onChange={(e) => onChange(e.target.value)}
          rows={Math.min(8, Math.max(2, s.split("\n").length))}
        />
      );
    }
    return (
      <input
        type="text"
        className={styles.input}
        value={s}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (t === "number") {
    return (
      <input
        type="number"
        className={styles.input}
        value={value as number}
        onChange={(e) => {
          const n = e.target.value === "" ? 0 : Number(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
      />
    );
  }

  if (t === "boolean") {
    return (
      <label className={styles.toggleWrap}>
        <input
          type="checkbox"
          checked={value as boolean}
          onChange={(e) => onChange(e.target.checked)}
          className={styles.toggle}
        />
        <span className={styles.toggleLabel}>
          {(value as boolean) ? "true" : "false"}
        </span>
      </label>
    );
  }

  if (t === "null") {
    return (
      <div className={styles.nullValue}>
        <span className={styles.nullBadge}>empty (null)</span>
        <span className={styles.nullHint}>Set as:</span>
        <button
          type="button"
          className={styles.nullSetBtn}
          onClick={() => onChange("")}
        >
          text
        </button>
        <button
          type="button"
          className={styles.nullSetBtn}
          onClick={() => onChange(0)}
        >
          number
        </button>
        <button
          type="button"
          className={styles.nullSetBtn}
          onClick={() => onChange(false)}
        >
          yes / no
        </button>
      </div>
    );
  }

  if (isContainer(value)) {
    const count =
      t === "array"
        ? (value as unknown[]).length
        : Object.keys(value as object).length;
    const label = t === "array" ? `array · ${count} items` : `object · ${count} fields`;
    return (
      <div className={styles.containerRef}>
        <span className={styles.containerBadge}>{label}</span>
        {onOpen && (
          <button type="button" className={styles.openBtn} onClick={onOpen}>
            open →
          </button>
        )}
      </div>
    );
  }

  return null;
}

export function TypeSelector({
  current,
  onChangeType,
}: {
  current: JSONType;
  onChangeType: (t: JSONType) => void;
}) {
  const types: JSONType[] = [
    "string",
    "number",
    "boolean",
    "null",
    "object",
    "array",
  ];
  return (
    <select
      className={styles.typeSelect}
      value={current}
      onChange={(e) => {
        const t = e.target.value as JSONType;
        if (t !== current) onChangeType(t);
      }}
      aria-label="Field type"
    >
      {types.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

export { defaultValueFor };
