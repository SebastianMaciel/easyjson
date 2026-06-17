"use client";

import { useCallback, useState } from "react";
import Uploader from "@/components/Uploader";
import TreeView from "@/components/TreeView";
import Editor from "@/components/Editor";
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
          <span className={styles.tag}>read · edit · download</span>
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
          {isContainer(data) ? (
            <TreeView root={data} selected={selected} onSelect={setSelected} />
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
