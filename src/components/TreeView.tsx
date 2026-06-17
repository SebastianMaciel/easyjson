"use client";

import { useMemo, useState } from "react";
import {
  type JSONValue,
  type JSONObject,
  type Path,
  getAt,
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

  const visible = useMemo(() => {
    if (!trimmed) return null;
    const set = new Set<string>();
    walk(root, [], trimmed, set);
    return set;
  }, [root, trimmed]);

  const effectiveExpanded = useMemo(() => {
    if (!visible) return expanded;
    return new Set<string>([...expanded, ...visible]);
  }, [expanded, visible]);

  const flatPaths = useMemo(
    () => flatten(root, effectiveExpanded, visible),
    [root, effectiveExpanded, visible],
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const selKey = pathKey(selected);
    const idx = flatPaths.findIndex((p) => pathKey(p) === selKey);
    if (idx === -1) return;
    const node = getAt(root, selected);
    const isOpen = effectiveExpanded.has(selKey);
    const container = isContainer(node);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (idx < flatPaths.length - 1) onSelect(flatPaths[idx + 1]);
        return;
      case "ArrowUp":
        e.preventDefault();
        if (idx > 0) onSelect(flatPaths[idx - 1]);
        return;
      case "ArrowRight":
        e.preventDefault();
        if (container) {
          if (!isOpen) {
            toggle(selected);
          } else if (idx < flatPaths.length - 1) {
            onSelect(flatPaths[idx + 1]);
          }
        }
        return;
      case "ArrowLeft":
        e.preventDefault();
        if (container && isOpen) {
          toggle(selected);
        } else if (selected.length > 0) {
          onSelect(selected.slice(0, -1));
        }
        return;
      case "Home":
        e.preventDefault();
        onSelect(flatPaths[0]);
        return;
      case "End":
        e.preventDefault();
        onSelect(flatPaths[flatPaths.length - 1]);
        return;
      case "Enter":
      case " ":
        if (container) {
          e.preventDefault();
          toggle(selected);
        }
        return;
    }
  };

  return (
    <ul
      className={styles.tree}
      role="tree"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-activedescendant={`tn-${pathKey(selected)}`}
    >
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

function flatten(
  root: JSONValue,
  expanded: Set<string>,
  visible: Set<string> | null,
): Path[] {
  const out: Path[] = [];
  const recurse = (value: JSONValue, path: Path) => {
    if (visible && !visible.has(pathKey(path))) return;
    out.push(path);
    if (!isContainer(value)) return;
    if (!expanded.has(pathKey(path))) return;
    if (Array.isArray(value)) {
      (value as JSONValue[]).forEach((v, i) => recurse(v, [...path, i]));
    } else {
      Object.entries(value as JSONObject).forEach(([k, v]) =>
        recurse(v, [...path, k]),
      );
    }
  };
  recurse(root, []);
  return out;
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
        id={`tn-${pathKey(path)}`}
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
