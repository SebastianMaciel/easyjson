"use client";

import { useCallback, useEffect, useState } from "react";
import Uploader from "@/components/Uploader";
import TreeView from "@/components/TreeView";
import Editor from "@/components/Editor";
import ThemeToggle from "@/components/ThemeToggle";
import RawView from "@/components/RawView";
import { ConfirmProvider, useConfirm } from "@/components/ConfirmDialog";
import {
  type JSONValue,
  type Path,
  adjustPathAfterDelete,
  deleteAt,
  duplicateAt,
  filenameIssues,
  getAt,
  isContainer,
  moveArrayItem,
  pretty,
  sanitizeFilename,
} from "@/lib/json";
import styles from "./page.module.css";

export default function Page() {
  return (
    <ConfirmProvider>
      <PageInner />
    </ConfirmProvider>
  );
}

function FilenameField({
  filename,
  onChange,
}: {
  filename: string;
  onChange: (name: string) => void;
}) {
  const issues = filenameIssues(filename);
  const sanitized = sanitizeFilename(filename);
  const willChange = sanitized !== filename;
  return (
    <div className={styles.filenameWrap}>
      <input
        type="text"
        value={filename}
        onChange={(e) => onChange(e.target.value)}
        className={`${styles.filenameInput} ${
          issues.length > 0 ? styles.filenameInputWarn : ""
        }`}
        aria-label="Filename"
        aria-invalid={issues.length > 0 ? true : undefined}
        spellCheck={false}
      />
      {issues.length > 0 && (
        <span
          className={styles.filenameWarn}
          data-tooltip={
            willChange
              ? `${issues[0]}. Will save as "${sanitized}"`
              : issues[0]
          }
          data-tooltip-pos="bottom"
          aria-label="Filename warning"
        >
          !
        </span>
      )}
    </div>
  );
}

function PageInner() {
  const confirm = useConfirm();
  const [data, setData] = useState<JSONValue | null>(null);
  const [original, setOriginal] = useState<JSONValue | null>(null);
  const [filename, setFilename] = useState("untitled.json");
  const [selected, setSelected] = useState<Path>([]);
  const [advanced, setAdvanced] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [restored, setRestored] = useState(false);
  const [search, setSearch] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"form" | "raw">("form");

  // hydrate theme + session from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("easyjson.theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
    }

    try {
      const raw = localStorage.getItem("easyjson.session");
      if (raw) {
        const s = JSON.parse(raw) as {
          data?: JSONValue;
          original?: JSONValue;
          filename?: string;
          selected?: Path;
          advanced?: boolean;
        };
        if (s.data !== undefined) setData(s.data);
        if (s.original !== undefined) setOriginal(s.original);
        if (typeof s.filename === "string") setFilename(s.filename);
        if (Array.isArray(s.selected)) setSelected(s.selected);
        if (typeof s.advanced === "boolean") setAdvanced(s.advanced);
      }
    } catch {
      // ignore corrupted session
    }
    setRestored(true);
  }, []);

  // persist session on every change (after initial restore)
  useEffect(() => {
    if (!restored) return;
    if (data === null) {
      localStorage.removeItem("easyjson.session");
      return;
    }
    try {
      localStorage.setItem(
        "easyjson.session",
        JSON.stringify({ data, original, filename, selected, advanced }),
      );
    } catch {
      // quota exceeded or unavailable — silently ignore
    }
  }, [restored, data, original, filename, selected, advanced]);

  // apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("easyjson.theme", next);
      return next;
    });
  }, []);

  const handleLoad = useCallback(
    (value: JSONValue, name: string, warn?: string | null) => {
      setData(value);
      setOriginal(structuredClone(value));
      setFilename(name);
      setSelected([]);
      setWarning(warn ?? null);
    },
    [],
  );

  const handleChange = useCallback(
    (next: JSONValue) => {
      setData(next);
      let path = selected;
      while (path.length > 0 && getAt(next, path) === undefined) {
        path = path.slice(0, -1);
      }
      if (path.length !== selected.length) setSelected(path);
    },
    [selected],
  );

  const handleDelete = useCallback(
    (path: Path) => {
      if (data === null || path.length === 0) return;
      setData(deleteAt(data, path));
      setSelected((curr) => adjustPathAfterDelete(curr, path));
    },
    [data],
  );

  const handleDuplicate = useCallback(
    (path: Path) => {
      if (data === null) return;
      const result = duplicateAt(data, path);
      if (!result) return;
      setData(result.root);
      setSelected(result.newPath);
    },
    [data],
  );

  const handleMove = useCallback(
    (path: Path, direction: "up" | "down") => {
      if (data === null) return;
      const result = moveArrayItem(data, path, direction);
      if (!result) return;
      setData(result.root);
      setSelected((curr) => {
        if (
          curr.length >= path.length &&
          path.every((k, i) => k === curr[i]) &&
          typeof curr[path.length - 1] === "number"
        ) {
          return [
            ...result.newPath,
            ...curr.slice(path.length),
          ];
        }
        return curr;
      });
    },
    [data],
  );

  const handleReset = useCallback(async () => {
    if (data !== null) {
      const ok = await confirm({
        title: "Discard JSON?",
        description: "All your edits will be lost.",
        confirmLabel: "Discard",
        variant: "danger",
      });
      if (!ok) return;
    }
    setData(null);
    setOriginal(null);
    setSelected([]);
    setWarning(null);
  }, [data, confirm]);

  const handleDownload = useCallback(() => {
    if (data === null) return;
    const blob = new Blob([pretty(data)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sanitizeFilename(filename);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [data, filename]);

  if (data === null) {
    return (
      <main className={styles.main}>
        <header className={styles.headerEmpty}>
          <span className={styles.brand}>easyjson</span>
          <div className={styles.headerRight}>
            <span className={styles.tag}>read · edit · download</span>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>
        <Uploader onLoad={handleLoad} />
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.brand}>easyjson</span>
          <FilenameField filename={filename} onChange={setFilename} />
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle} role="tablist" aria-label="View mode">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "form"}
              className={`${styles.viewBtn} ${
                viewMode === "form" ? styles.viewBtnActive : ""
              }`}
              onClick={() => setViewMode("form")}
            >
              Form
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "raw"}
              className={`${styles.viewBtn} ${
                viewMode === "raw" ? styles.viewBtnActive : ""
              }`}
              onClick={() => setViewMode("raw")}
            >
              Raw JSON
            </button>
          </div>
          <label className={styles.advancedToggle}>
            <input
              type="checkbox"
              checked={advanced}
              onChange={(e) => setAdvanced(e.target.checked)}
            />
            <span>Advanced mode</span>
          </label>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
          <button
            type="button"
            className={styles.btnGhost}
            onClick={handleReset}
            data-tooltip="Discard and start over"
            data-tooltip-pos="bottom"
          >
            New
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleDownload}
          >
            ↓ Download JSON
          </button>
        </div>
      </header>

      {warning && (
        <div className={styles.warningBar} role="status">
          <span className={styles.warningIcon} aria-hidden="true">!</span>
          <span className={styles.warningText}>{warning}</span>
          <button
            type="button"
            className={styles.warningClose}
            onClick={() => setWarning(null)}
            aria-label="Dismiss warning"
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.body}>
        <aside className={styles.treePane} aria-label="JSON tree">
          {isContainer(data) && (
            <div className={styles.treeSearch}>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fields…"
                className={styles.searchInput}
                aria-label="Search fields"
              />
              {search && (
                <button
                  type="button"
                  className={styles.searchClear}
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          )}
          {isContainer(data) ? (
            <TreeView
              root={data}
              selected={selected}
              query={search}
              onSelect={setSelected}
            />
          ) : (
            <div className={styles.treeEmpty}>
              Root is a single value.
              <br />
              Edit it on the right.
            </div>
          )}
        </aside>
        <section className={styles.editorPane} aria-label="Editor">
          {viewMode === "form" ? (
            <Editor
              root={data}
              original={original}
              path={selected}
              onChange={handleChange}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onMove={handleMove}
              onNavigate={setSelected}
              advanced={advanced}
            />
          ) : (
            <RawView data={data} />
          )}
        </section>
      </div>
    </main>
  );
}
