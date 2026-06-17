# easyjson

> Read, edit, and download any JSON without opening a code editor.

A friendly JSON editor for non-technical people. Drop in a JSON, browse it as a tree, edit values in a form, and download a clean file back. Built for **product, marketing, and other roles** that occasionally receive a JSON from devs and need to modify it without touching an IDE.

Everything happens **in your browser**. No upload, no signup, no account.

---

## What it does

- **Drop, paste, or start blank.** Loads JSON from a file, from clipboard, or from an empty object/array.
- **Tree + form workspace.** Left column shows the structure (with search). Right column is a form for whatever you click.
- **Smart inputs** for strings that look like dates, datetimes, times, URLs, emails, hex colors, or UUIDs — calendar pickers, color pickers, open-in-tab buttons, etc.
- **Type-aware editing.** Each value type (string, number, boolean, null, object, array) renders the right input.
- **Three modes:**
  - **Default** — edit values only, no structural changes.
  - **🔒 Read only** — disable everything, look but don't touch.
  - **⚙ Advanced** — rename, delete, duplicate, reorder, change types, add new fields.
- **Form ↔ Raw toggle.** Switch between the form editor and the actual JSON text (with syntax highlighting + copy button).
- **Field reset.** Any value that differs from the loaded original gets a ↺ button to restore it.
- **Sticky helpers**: live validation when pasting, sanitised filename for download, warning for unsafe big integers (> 9 × 10¹⁵), confirmation before deleting non-empty groups, and more.
- **Built-in help** — a `?` button opens a detailed walkthrough with real-clone demos of every control.

## Stack

| What | Why |
|---|---|
| **Next.js 16 + React 19** | App Router, Turbopack |
| **TypeScript** | Type-safe state and JSON ops |
| **CSS Modules** | Scoped, no runtime |
| **react-window** | Tree virtualization for huge JSONs |
| **Inter + Fraunces + Recursive** | Sans + serif + mono via `next/font/google` |

## Getting started

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

```bash
pnpm build   # production build
pnpm start   # serve the production build
```

## Project structure

```
src/
├── app/
│   ├── layout.tsx            # fonts, html lang
│   ├── globals.css           # tokens, tooltip styles, focus
│   ├── page.tsx              # main page (state + header + body)
│   ├── page.module.css
│   ├── not-found.tsx         # custom 404
│   ├── error.tsx             # per-segment error boundary
│   ├── global-error.tsx      # root error boundary
│   └── error.module.css
├── components/
│   ├── Uploader.tsx          # drop / paste / start blank
│   ├── TreeView.tsx          # virtualized tree (left column)
│   ├── Editor.tsx            # form editor (right column)
│   ├── ValueField.tsx        # type-aware inputs (incl. smart fields)
│   ├── RawView.tsx           # JSON syntax highlighted, read-only
│   ├── ThemeToggle.tsx       # light/dark toggle
│   ├── ConfirmDialog.tsx     # custom confirm + provider/hook
│   ├── HelpModal.tsx         # in-app help with clone-demos
│   ├── icons.tsx             # shared SVG icons
│   └── *.module.css          # one per component
└── lib/
    └── json.ts               # types, paths, ops, helpers
```

## How the editor works

State lives in `app/page.tsx`:

- `data: JSONValue | null` — the JSON being edited
- `original: JSONValue | null` — snapshot at load time, for the field-reset feature
- `selected: Path` — currently-selected node path (array of keys/indices)
- `viewMode`, `advanced`, `readOnly`, `theme`, `helpOpen`, etc.

All structural ops in `lib/json.ts` use **structural sharing**: only the path from root to the modified node is cloned, siblings keep their references. So a 5000-item array doesn't re-clone every keystroke.

State is persisted to `localStorage` (`easyjson.session`) so a refresh doesn't lose work. The JSON itself never leaves the browser.

## Smart string detection

The editor scans string values with a small set of regexes. When a string matches a known shape, the input adapts:

| Pattern | Input |
|---|---|
| `yyyy-mm-dd` | date picker |
| ISO 8601 with time | datetime-local picker (timezone preserved) |
| `HH:MM` or `HH:MM:SS` | time picker |
| `#` + 3/4/6/8 hex digits | color swatch + native picker |
| `https?://...` | text input + open-in-tab button |
| email shape | text input + mailto button |
| UUID v4 shape | mono input + UUID badge |

Edit the value into something that doesn't match → input falls back to plain text. No escape hatch needed.

## Roadmap

- [ ] JSON Schema validation as a power-user toggle
- [ ] Inline hint convention (`__hint_field: "..."`) for devs to annotate fields they share
- [ ] Drag-and-drop reorder in arrays
- [ ] Diff view against the loaded original
- [ ] Pinch/long-press gestures on touch devices for advanced controls

## Why

The flow we keep seeing: a dev exports a JSON file and sends it to someone in product or marketing for a small change. The receiver opens it in Notepad / TextEdit / VS Code, edits something, breaks the syntax somewhere, sends it back, gets bounced. easyjson removes the syntax-breaking step.
