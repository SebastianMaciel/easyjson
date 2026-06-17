"use client";

import { useState } from "react";
import {
  type JSONValue,
  type JSONType,
  type Path,
  deepEqual,
  defaultValueFor,
  deleteAt,
  getAt,
  hasAt,
  isContainer,
  renameKey,
  setAt,
  typeOf,
} from "@/lib/json";
import ValueField, { TypeSelector } from "./ValueField";
import styles from "./Editor.module.css";

type Props = {
  root: JSONValue;
  original: JSONValue | null;
  path: Path;
  onChange: (next: JSONValue) => void;
  onNavigate: (p: Path) => void;
  advanced: boolean;
};

export default function Editor({
  root,
  original,
  path,
  onChange,
  onNavigate,
  advanced,
}: Props) {
  const node = getAt(root, path);
  const nodeType = typeOf(node);
  const lastKey = path.length === 0 ? "root" : String(path[path.length - 1]);

  const handleChildChange = (childKey: string | number, newValue: JSONValue) => {
    onChange(setAt(root, [...path, childKey], newValue));
  };

  const resetInfo = (fieldPath: Path) => {
    if (!original) return null;
    if (!hasAt(original, fieldPath)) return null;
    const orig = getAt(original, fieldPath);
    const curr = getAt(root, fieldPath);
    if (deepEqual(orig, curr)) return null;
    return { value: orig };
  };

  return (
    <div className={styles.editor}>
      <Breadcrumb path={path} onNavigate={onNavigate} />

      {!isContainer(node) ? (
        <PrimitiveEditor
          label={lastKey}
          value={node}
          onChange={(v) => onChange(setAt(root, path, v))}
          advanced={advanced}
          canChangeType={path.length > 0}
          reset={resetInfo(path)}
          onReset={(v) => onChange(setAt(root, path, v))}
        />
      ) : nodeType === "array" ? (
        <ArrayEditor
          root={root}
          path={path}
          items={node as JSONValue[]}
          resetInfo={resetInfo}
          onChange={onChange}
          onChildChange={handleChildChange}
          onNavigate={onNavigate}
          advanced={advanced}
        />
      ) : (
        <ObjectEditor
          root={root}
          path={path}
          obj={node as Record<string, JSONValue>}
          resetInfo={resetInfo}
          onChange={onChange}
          onChildChange={handleChildChange}
          onNavigate={onNavigate}
          advanced={advanced}
        />
      )}
    </div>
  );
}

function Breadcrumb({
  path,
  onNavigate,
}: {
  path: Path;
  onNavigate: (p: Path) => void;
}) {
  const crumbs = [{ label: "root", path: [] as Path }];
  for (let i = 0; i < path.length; i++) {
    const segment = path[i];
    crumbs.push({
      label: typeof segment === "number" ? `[${segment}]` : String(segment),
      path: path.slice(0, i + 1),
    });
  }
  return (
    <nav className={styles.breadcrumb} aria-label="Path">
      {crumbs.map((c, i) => (
        <span key={i} className={styles.crumbWrap}>
          <button
            type="button"
            className={`${styles.crumb} ${i === crumbs.length - 1 ? styles.crumbActive : ""}`}
            onClick={() => onNavigate(c.path)}
          >
            {c.label}
          </button>
          {i < crumbs.length - 1 && <span className={styles.crumbSep}>›</span>}
        </span>
      ))}
    </nav>
  );
}

function PrimitiveEditor({
  label,
  value,
  onChange,
  advanced,
  canChangeType,
  reset,
  onReset,
}: {
  label: string;
  value: JSONValue;
  onChange: (v: JSONValue) => void;
  advanced: boolean;
  canChangeType: boolean;
  reset: { value: JSONValue } | null;
  onReset: (v: JSONValue) => void;
}) {
  const t = typeOf(value);
  return (
    <div className={styles.section}>
      <div className={styles.fieldRow}>
        <label className={styles.fieldLabel}>{label}</label>
        <div className={styles.fieldValue}>
          <ValueField value={value} onChange={onChange} advanced={advanced} />
        </div>
        <div className={styles.fieldActions}>
          {reset && <ResetButton orig={reset.value} onReset={onReset} />}
          {advanced && canChangeType && (
            <TypeSelector
              current={t}
              onChangeType={(nt) => onChange(defaultValueFor(nt))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ResetButton({
  orig,
  onReset,
}: {
  orig: JSONValue;
  onReset: (v: JSONValue) => void;
}) {
  return (
    <button
      type="button"
      className={styles.resetBtn}
      onClick={() => onReset(structuredClone(orig))}
      aria-label="Reset to original value"
      title="Reset to original value"
    >
      ↺
    </button>
  );
}

function ObjectEditor({
  root,
  path,
  obj,
  resetInfo,
  onChange,
  onChildChange,
  onNavigate,
  advanced,
}: {
  root: JSONValue;
  path: Path;
  obj: Record<string, JSONValue>;
  resetInfo: (p: Path) => { value: JSONValue } | null;
  onChange: (next: JSONValue) => void;
  onChildChange: (key: string | number, v: JSONValue) => void;
  onNavigate: (p: Path) => void;
  advanced: boolean;
}) {
  const keys = Object.keys(obj);
  return (
    <div className={styles.section}>
      <div className={styles.sectionMeta}>
        {keys.length} {keys.length === 1 ? "field" : "fields"}
      </div>
      <div className={styles.fields}>
        {keys.length === 0 ? (
          <div className={styles.empty}>No fields yet.</div>
        ) : (
          keys.map((k) => (
            <ChildRow
              key={k}
              parentPath={path}
              isArray={false}
              keyOrIndex={k}
              value={obj[k]}
              advanced={advanced}
              reset={resetInfo([...path, k])}
              onReset={(v) => onChange(setAt(root, [...path, k], v))}
              onChildChange={(v) => onChildChange(k, v)}
              onNavigate={() => onNavigate([...path, k])}
              onRename={(newKey) => onChange(renameKey(root, path, k, newKey))}
              onDelete={() => onChange(deleteAt(root, [...path, k]))}
            />
          ))
        )}
      </div>
      {advanced && (
        <AddField
          existingKeys={keys}
          onAdd={(newKey, type) =>
            onChange(setAt(root, [...path, newKey], defaultValueFor(type)))
          }
        />
      )}
    </div>
  );
}

function ArrayEditor({
  root,
  path,
  items,
  resetInfo,
  onChange,
  onChildChange,
  onNavigate,
  advanced,
}: {
  root: JSONValue;
  path: Path;
  items: JSONValue[];
  resetInfo: (p: Path) => { value: JSONValue } | null;
  onChange: (next: JSONValue) => void;
  onChildChange: (key: string | number, v: JSONValue) => void;
  onNavigate: (p: Path) => void;
  advanced: boolean;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionMeta}>
        {items.length} {items.length === 1 ? "item" : "items"}
      </div>
      <div className={styles.fields}>
        {items.length === 0 ? (
          <div className={styles.empty}>No items yet.</div>
        ) : (
          items.map((v, i) => (
            <ChildRow
              key={i}
              parentPath={path}
              isArray
              keyOrIndex={i}
              value={v}
              advanced={advanced}
              reset={resetInfo([...path, i])}
              onReset={(nv) => onChange(setAt(root, [...path, i], nv))}
              onChildChange={(nv) => onChildChange(i, nv)}
              onNavigate={() => onNavigate([...path, i])}
              onRename={() => {}}
              onDelete={() => onChange(deleteAt(root, [...path, i]))}
            />
          ))
        )}
      </div>
      {advanced && (
        <AddItem
          onAdd={(type) =>
            onChange(setAt(root, [...path, items.length], defaultValueFor(type)))
          }
        />
      )}
    </div>
  );
}

function ChildRow({
  parentPath,
  isArray,
  keyOrIndex,
  value,
  advanced,
  reset,
  onReset,
  onChildChange,
  onNavigate,
  onRename,
  onDelete,
}: {
  parentPath: Path;
  isArray: boolean;
  keyOrIndex: string | number;
  value: JSONValue;
  advanced: boolean;
  reset: { value: JSONValue } | null;
  onReset: (v: JSONValue) => void;
  onChildChange: (v: JSONValue) => void;
  onNavigate: () => void;
  onRename: (newKey: string) => void;
  onDelete: () => void;
}) {
  const t = typeOf(value);
  const [renaming, setRenaming] = useState(false);
  const [draftKey, setDraftKey] = useState(String(keyOrIndex));

  const commitRename = () => {
    setRenaming(false);
    if (draftKey && draftKey !== String(keyOrIndex)) onRename(draftKey);
    else setDraftKey(String(keyOrIndex));
  };

  return (
    <div className={styles.fieldRow}>
      <div className={styles.fieldLabel}>
        {isArray ? (
          <span className={styles.indexBadge}>[{keyOrIndex}]</span>
        ) : renaming ? (
          <input
            className={styles.keyInput}
            value={draftKey}
            autoFocus
            onChange={(e) => setDraftKey(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setRenaming(false);
                setDraftKey(String(keyOrIndex));
              }
            }}
          />
        ) : (
          <button
            type="button"
            className={styles.keyButton}
            disabled={!advanced}
            onClick={() => advanced && setRenaming(true)}
            title={advanced ? "Click to rename" : ""}
          >
            {keyOrIndex}
          </button>
        )}
      </div>
      <div className={styles.fieldValue}>
        <ValueField
          value={value}
          onChange={onChildChange}
          onOpen={onNavigate}
          advanced={advanced}
        />
      </div>
      <div className={styles.fieldActions}>
        {reset && <ResetButton orig={reset.value} onReset={onReset} />}
        {advanced && (
          <>
            <TypeSelector
              current={t}
              onChangeType={(nt) => onChildChange(defaultValueFor(nt))}
            />
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={onDelete}
              aria-label="Delete"
            >
              ×
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function AddField({
  existingKeys,
  onAdd,
}: {
  existingKeys: string[];
  onAdd: (key: string, type: JSONType) => void;
}) {
  const [open, setOpen] = useState(false);
  const [key, setKey] = useState("");
  const [type, setType] = useState<JSONType>("string");
  const conflict = existingKeys.includes(key);
  const canAdd = key.trim().length > 0 && !conflict;

  if (!open) {
    return (
      <button type="button" className={styles.addBtn} onClick={() => setOpen(true)}>
        + Add field
      </button>
    );
  }
  return (
    <div className={styles.addRow}>
      <input
        autoFocus
        className={styles.input}
        placeholder="field name"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && canAdd) {
            onAdd(key.trim(), type);
            setKey("");
            setOpen(false);
          }
          if (e.key === "Escape") {
            setOpen(false);
            setKey("");
          }
        }}
      />
      <TypeSelector current={type} onChangeType={setType} />
      <button
        type="button"
        className={styles.addConfirm}
        disabled={!canAdd}
        onClick={() => {
          onAdd(key.trim(), type);
          setKey("");
          setOpen(false);
        }}
      >
        Add
      </button>
      <button
        type="button"
        className={styles.cancelBtn}
        onClick={() => {
          setOpen(false);
          setKey("");
        }}
      >
        Cancel
      </button>
      {conflict && <span className={styles.errMsg}>Field already exists</span>}
    </div>
  );
}

function AddItem({ onAdd }: { onAdd: (type: JSONType) => void }) {
  const [type, setType] = useState<JSONType>("string");
  return (
    <div className={styles.addRow}>
      <span className={styles.addLabel}>Add item:</span>
      <TypeSelector current={type} onChangeType={setType} />
      <button
        type="button"
        className={styles.addConfirm}
        onClick={() => onAdd(type)}
      >
        + Add
      </button>
    </div>
  );
}
