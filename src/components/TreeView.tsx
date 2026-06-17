"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  List,
  type ListImperativeAPI,
  type RowComponentProps,
} from "react-window";
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

type FlatItem = {
  path: Path;
  label: string;
  depth: number;
  container: boolean;
  expanded: boolean;
  isArray: boolean;
  childCount: number;
  preview: string;
  isRoot: boolean;
};

const ROW_HEIGHT = 28;

export default function TreeView({ root, selected, query, onSelect }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([pathKey([])]),
  );

  const trimmed = query.trim().toLowerCase();

  const visible = useMemo(() => {
    if (!trimmed) return null;
    const set = new Set<string>();
    walkSearch(root, [], trimmed, set);
    return set;
  }, [root, trimmed]);

  const effectiveExpanded = useMemo(() => {
    if (!visible) return expanded;
    return new Set<string>([...expanded, ...visible]);
  }, [expanded, visible]);

  const flatItems = useMemo(
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

  const listRef = useRef<ListImperativeAPI>(null);

  // auto-expand every ancestor of the selected path so the tree reveals it
  useEffect(() => {
    if (selected.length === 0) return;
    setExpanded((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (let i = 0; i < selected.length; i++) {
        const k = pathKey(selected.slice(0, i));
        if (!next.has(k)) {
          next.add(k);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathKey(selected)]);

  // scroll selection into view on change
  const selKey = pathKey(selected);
  useEffect(() => {
    const idx = flatItems.findIndex((it) => pathKey(it.path) === selKey);
    if (idx >= 0 && listRef.current) {
      listRef.current.scrollToRow({ index: idx, align: "smart" });
    }
  }, [selKey, flatItems]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const idx = flatItems.findIndex((it) => pathKey(it.path) === selKey);
    if (idx === -1) return;
    const node = getAt(root, selected);
    const isOpen = effectiveExpanded.has(selKey);
    const container = isContainer(node);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (idx < flatItems.length - 1) onSelect(flatItems[idx + 1].path);
        return;
      case "ArrowUp":
        e.preventDefault();
        if (idx > 0) onSelect(flatItems[idx - 1].path);
        return;
      case "ArrowRight":
        e.preventDefault();
        if (container) {
          if (!isOpen) toggle(selected);
          else if (idx < flatItems.length - 1) onSelect(flatItems[idx + 1].path);
        }
        return;
      case "ArrowLeft":
        e.preventDefault();
        if (container && isOpen) toggle(selected);
        else if (selected.length > 0) onSelect(selected.slice(0, -1));
        return;
      case "Home":
        e.preventDefault();
        onSelect(flatItems[0].path);
        return;
      case "End":
        e.preventDefault();
        onSelect(flatItems[flatItems.length - 1].path);
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
    <div
      className={styles.tree}
      role="tree"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-activedescendant={`tn-${selKey}`}
    >
      <List
        listRef={listRef}
        rowCount={flatItems.length}
        rowHeight={ROW_HEIGHT}
        rowComponent={Row}
        rowProps={{ items: flatItems, selectedKey: selKey, query: trimmed, onSelect, onToggle: toggle }}
        className={styles.list}
      />
    </div>
  );
}

type RowProps = {
  items: FlatItem[];
  selectedKey: string;
  query: string;
  onSelect: (p: Path) => void;
  onToggle: (p: Path) => void;
};

function Row({
  index,
  style,
  items,
  selectedKey,
  query,
  onSelect,
  onToggle,
}: RowComponentProps<RowProps>) {
  const item = items[index];
  if (!item) return null;
  const itemKey = pathKey(item.path);
  const isSelected = itemKey === selectedKey;
  const indent = 0.6 + item.depth * 0.9;

  return (
    <div
      id={`tn-${itemKey}`}
      style={style}
      className={`${styles.row} ${isSelected ? styles.selected : ""}`}
      onClick={() => onSelect(item.path)}
    >
      <span
        className={styles.rowInner}
        style={{ paddingLeft: `${indent}rem` }}
      >
        {item.container ? (
          <button
            type="button"
            className={styles.chevron}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(item.path);
            }}
            aria-label={item.expanded ? "Collapse" : "Expand"}
          >
            {item.expanded ? "▾" : "▸"}
          </button>
        ) : (
          <span className={styles.chevronSpace} />
        )}
        <span className={styles.label}>{highlight(item.label, query)}</span>
        <span className={styles.meta}>
          {item.container
            ? item.isArray
              ? ` [${item.childCount}]`
              : ` {${item.childCount}}`
            : `: ${item.preview}`}
        </span>
      </span>
    </div>
  );
}

function walkSearch(
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
        if (walkSearch(v as JSONValue, [...path, i], query, out))
          childMatches = true;
      });
    } else {
      Object.entries(value as JSONObject).forEach(([k, v]) => {
        if (walkSearch(v as JSONValue, [...path, k], query, out))
          childMatches = true;
      });
    }
  }
  if (selfMatches || childMatches) {
    out.add(pathKey(path));
    return true;
  }
  return false;
}

function flatten(
  root: JSONValue,
  expanded: Set<string>,
  visible: Set<string> | null,
): FlatItem[] {
  const out: FlatItem[] = [];
  const recurse = (value: JSONValue, path: Path, depth: number) => {
    if (visible && !visible.has(pathKey(path))) return;
    const t = typeOf(value);
    const container = isContainer(value);
    const isArray = t === "array";
    const childCount = !container
      ? 0
      : isArray
        ? (value as JSONValue[]).length
        : Object.keys(value as JSONObject).length;
    out.push({
      path,
      label: path.length === 0 ? "root" : String(path[path.length - 1]),
      depth,
      container,
      expanded: expanded.has(pathKey(path)),
      isArray,
      childCount,
      preview: container ? "" : preview(value),
      isRoot: path.length === 0,
    });
    if (!container) return;
    if (!expanded.has(pathKey(path))) return;
    if (Array.isArray(value)) {
      (value as JSONValue[]).forEach((v, i) =>
        recurse(v, [...path, i], depth + 1),
      );
    } else {
      Object.entries(value as JSONObject).forEach(([k, v]) =>
        recurse(v, [...path, k], depth + 1),
      );
    }
  };
  recurse(root, [], 0);
  return out;
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
