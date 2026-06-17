"use client";

import {
  type JSONValue,
  type JSONType,
  defaultValueFor,
  detectStringKind,
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
    return <StringField value={value as string} onChange={onChange} />;
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

function StringField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: JSONValue) => void;
}) {
  const isMultiline = value.includes("\n") || value.length > 80;
  if (isMultiline) {
    return (
      <textarea
        className={`${styles.input} ${styles.textarea}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={Math.min(8, Math.max(2, value.split("\n").length))}
      />
    );
  }
  const kind = detectStringKind(value);
  if (kind === "date") {
    return (
      <input
        type="date"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (kind === "datetime") {
    const head = value.slice(0, 16);
    const tail = value.slice(16);
    return (
      <input
        type="datetime-local"
        className={styles.input}
        value={head}
        onChange={(e) => onChange(e.target.value + tail)}
      />
    );
  }
  if (kind === "time") {
    return (
      <input
        type="time"
        step={value.length > 5 ? 1 : 60}
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (kind === "color") {
    const isShort = /^#[0-9a-fA-F]{3,4}$/.test(value);
    const pickerValue = isShort
      ? `#${value
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("")}`
      : value.length >= 7
        ? value.slice(0, 7)
        : value;
    return (
      <div className={styles.colorWrap}>
        <input
          type="color"
          className={styles.colorPicker}
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Color picker"
        />
        <input
          type="text"
          className={`${styles.input} ${styles.colorText}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }
  if (kind === "url") {
    return (
      <div className={styles.adornedWrap}>
        <input
          type="url"
          className={`${styles.input} ${styles.adornedInput}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <a
          className={styles.adornBtn}
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open URL"
          data-tooltip="Open in new tab"
          data-tooltip-pos="bottom"
        >
          ↗
        </a>
      </div>
    );
  }
  if (kind === "email") {
    return (
      <div className={styles.adornedWrap}>
        <input
          type="email"
          className={`${styles.input} ${styles.adornedInput}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <a
          className={styles.adornBtn}
          href={`mailto:${value}`}
          aria-label="Send email"
          data-tooltip="Open email client"
          data-tooltip-pos="bottom"
        >
          ✉
        </a>
      </div>
    );
  }
  if (kind === "uuid") {
    return (
      <div className={styles.uuidWrap}>
        <input
          type="text"
          className={`${styles.input} ${styles.uuidInput}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
        <span className={styles.uuidBadge}>UUID</span>
      </div>
    );
  }
  return (
    <input
      type="text"
      className={styles.input}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
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
