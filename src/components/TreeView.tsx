"use client";

import { useState, useMemo } from "react";
import {
  type JSONValue,
  type Path,
  isContainer,
  pathKey,
  typeOf,
} from "@/lib/json";
import styles from "./TreeView.module.css";

type Props = {
  root: JSONValue;
  selected: Path;
  onSelect: (p: Path) => void;
};

export default function TreeView({ root, selected, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([pathKey([])]),
  );

  const toggle = (path: Path) => {
    const key = pathKey(path);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <ul className={styles.tree} role="tree">
      <TreeNode
        nodeKey="root"
        value={root}
        path={[]}
        selected={selected}
        expanded={expanded}
        onToggle={toggle}
        onSelect={onSelect}
        isRoot
      />
    </ul>
  );
}

type NodeProps = {
  nodeKey: string;
  value: JSONValue;
  path: Path;
  selected: Path;
  expanded: Set<string>;
  onToggle: (p: Path) => void;
  onSelect: (p: Path) => void;
  isRoot?: boolean;
};

function TreeNode({
  nodeKey,
  value,
  path,
  selected,
  expanded,
  onToggle,
  onSelect,
  isRoot,
}: NodeProps) {
  const t = typeOf(value);
  const container = isContainer(value);
  const isExpanded = expanded.has(pathKey(path));
  const isSelected = pathKey(selected) === pathKey(path);

  const children = useMemo(() => {
    if (!container) return [];
    if (t === "array") {
      return (value as unknown[]).map((v, i) => ({
        key: String(i),
        value: v as JSONValue,
        path: [...path, i] as Path,
      }));
    }
    return Object.entries(value as Record<string, JSONValue>).map(
      ([k, v]) => ({
        key: k,
        value: v,
        path: [...path, k] as Path,
      }),
    );
  }, [container, t, value, path]);

  const label = isRoot ? "root" : nodeKey;
  const previewSuffix = container
    ? t === "array"
      ? ` [${children.length}]`
      : ` {${children.length}}`
    : "";

  return (
    <li role="treeitem" aria-expanded={container ? isExpanded : undefined}>
      <div
        className={`${styles.row} ${isSelected ? styles.selected : ""}`}
        onClick={() => onSelect(path)}
      >
        {container ? (
          <button
            type="button"
            className={styles.chevron}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(path);
            }}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className={styles.chevronSpace} />
        )}
        <span className={styles.label}>{label}</span>
        <span className={styles.meta}>{previewSuffix || `: ${preview(value)}`}</span>
      </div>
      {container && isExpanded && children.length > 0 && (
        <ul className={styles.children}>
          {children.map((c) => (
            <TreeNode
              key={c.key}
              nodeKey={c.key}
              value={c.value}
              path={c.path}
              selected={selected}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function preview(v: JSONValue): string {
  const t = typeOf(v);
  if (t === "string") {
    const s = v as string;
    return `"${s.length > 24 ? s.slice(0, 24) + "…" : s}"`;
  }
  if (t === "null") return "null";
  return String(v);
}
