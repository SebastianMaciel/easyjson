"use client";

import { useEffect, useMemo, useState } from "react";
import {
  type JSONValue,
  type JSONObject,
  type Path,
  isContainer,
  pathKey,
  typeOf,
} from "@/lib/json";
import styles from "./TreeView.module.css";

type Props = {
  root: JSONValue;
  selected: Path;
  query: string;
  onSelect: (p: Path) => void;
};

export default function TreeView({ root, selected, query, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([pathKey([])]),
  );

  const trimmed = query.trim().toLowerCase();

  // compute which nodes match the query (themselves or have matching descendants)
  const visible = useMemo(() => {
    if (!trimmed) return null;
    const set = new Set<string>();
    walk(root, [], trimmed, set);
    return set;
  }, [root, trimmed]);

  // when querying, auto-expand all visible containers
  const effectiveExpanded = useMemo(() => {
    if (!visible) return expanded;
    return new Set<string>([...expanded, ...visible]);
  }, [expanded, visible]);

  // when the query changes, ensure we auto-expand even though base expanded didn't change
  useEffect(() => {
    // no-op; effectiveExpanded already merges in visible
  }, [visible]);

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
        expanded={effectiveExpanded}
        visible={visible}
        query={trimmed}
        onToggle={toggle}
        onSelect={onSelect}
        isRoot
      />
    </ul>
  );
}

function walk(
  value: JSONValue,
  path: Path,
  query: string,
  out: Set<string>,
): boolean {
  let selfMatches = false;
  if (path.length > 0) {
    const lastKey = String(path[path.length - 1]).toLowerCase();
    selfMatches = lastKey.includes(query);
  }
  let childMatches = false;
  if (isContainer(value)) {
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (walk(v as JSONValue, [...path, i], query, out)) childMatches = true;
      });
    } else {
      Object.entries(value as JSONObject).forEach(([k, v]) => {
        if (walk(v as JSONValue, [...path, k], query, out)) childMatches = true;
      });
    }
  }
  if (selfMatches || childMatches) {
    out.add(pathKey(path));
    return true;
  }
  return false;
}

type NodeProps = {
  nodeKey: string;
  value: JSONValue;
  path: Path;
  selected: Path;
  expanded: Set<string>;
  visible: Set<string> | null;
  query: string;
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
  visible,
  query,
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

  const visibleChildren = visible
    ? children.filter((c) => visible.has(pathKey(c.path)))
    : children;

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
        <span className={styles.label}>{highlight(label, query)}</span>
        <span className={styles.meta}>{previewSuffix || `: ${preview(value)}`}</span>
      </div>
      {container && isExpanded && visibleChildren.length > 0 && (
        <ul className={styles.children}>
          {visibleChildren.map((c) => (
            <TreeNode
              key={c.key}
              nodeKey={c.key}
              value={c.value}
              path={c.path}
              selected={selected}
              expanded={expanded}
              visible={visible}
              query={query}
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

function highlight(text: string, query: string) {
  if (!query) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className={styles.highlight}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}
