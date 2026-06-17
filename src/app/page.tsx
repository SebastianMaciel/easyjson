"use client";

import { useCallback, useEffect, useState } from "react";
import Uploader from "@/components/Uploader";
import TreeView from "@/components/TreeView";
import Editor from "@/components/Editor";
import ThemeToggle from "@/components/ThemeToggle";
import {
  type JSONValue,
  type Path,
  getAt,
  isContainer,
  pretty,
} from "@/lib/json";
import styles from "./page.module.css";

export default function Page() {
  const [data, setData] = useState<JSONValue | null>(null);
  const [original, setOriginal] = useState<JSONValue | null>(null);
  const [filename, setFilename] = useState("untitled.json");
  const [selected, setSelected] = useState<Path>([]);
  const [advanced, setAdvanced] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [restored, setRestored] = useState(false);
  const [search, setSearch] = useState("");

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

  const handleLoad = useCallback((value: JSONValue, name: string) => {
    setData(value);
    setOriginal(structuredClone(value));
    setFilename(name);
    setSelected([]);
  }, []);

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

  const handleReset = useCallback(() => {
    if (!data || confirm("Discard current JSON and start over?")) {
      setData(null);
      setOriginal(null);
      setSelected([]);
    }
  }, [data]);

  const handleDownload = useCallback(() => {
    if (data === null) return;
    const blob = new Blob([pretty(data)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = filename.replace(/\.json$/i, "") + ".json";
    a.href = url;
    a.download = safeName;
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
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className={styles.filenameInput}
            aria-label="Filename"
          />
        </div>
        <div className={styles.headerRight}>
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
            title="Discard and start over"
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
          <Editor
            root={data}
            original={original}
            path={selected}
            onChange={handleChange}
            onNavigate={setSelected}
            advanced={advanced}
          />
        </section>
      </div>
    </main>
  );
}
