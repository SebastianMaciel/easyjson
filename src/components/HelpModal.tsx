"use client";

import { useEffect } from "react";
import { LockIcon, MoonIcon, SlidersIcon } from "./icons";
import styles from "./HelpModal.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function HelpModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.dialog}>
        <header className={styles.head}>
          <div>
            <span className={styles.kicker}>Help</span>
            <h2 id="help-title" className={styles.title}>
              How to use easyjson
            </h2>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close help"
          >
            ×
          </button>
        </header>

        <div className={styles.body}>
          <section className={styles.section}>
            <span className={styles.eyebrow}>01 — At a glance</span>
            <h3>What is a JSON?</h3>
            <p className={styles.lead}>
              JSON is a way for software to store structured data as text. It
              looks like nested forms with named fields. Every value has a{" "}
              <em>type</em>, and easyjson adapts the editor to whatever type
              it sees.
            </p>
            <p>
              You don&apos;t need to write any code to use this tool. Drop a
              JSON file, click any field on the left, and edit its value on the
              right. When you&apos;re done, download it back as a clean JSON
              file. The original never leaves your browser.
            </p>
          </section>

          <section className={styles.section}>
            <span className={styles.eyebrow}>02 — Data types</span>
            <h3>The six types you&apos;ll see</h3>
            <p className={styles.lead}>
              Every value belongs to one of these six types. These are the same
              names the dev team uses; the <em>synonym</em> column is the term
              you may already be familiar with.
            </p>

            <div className={styles.typeBlock}>
              <div className={styles.typeHead}>
                <span className={`${styles.typeChip} ${styles.tString}`}>
                  string
                </span>
                <span className={styles.typeSyn}>synonym: text</span>
              </div>
              <p>Text wrapped in double quotes. Names, descriptions, codes, IDs.</p>
              <pre className={styles.example}>
                <code>{`"name": "Acme Inc.",
"code": "PROD-2026"`}</code>
              </pre>
            </div>

            <div className={styles.typeBlock}>
              <div className={styles.typeHead}>
                <span className={`${styles.typeChip} ${styles.tNumber}`}>
                  number
                </span>
                <span className={styles.typeSyn}>
                  synonym: integer, decimal
                </span>
              </div>
              <p>Whole or decimal numbers, no quotes. Counts, prices, ages.</p>
              <pre className={styles.example}>
                <code>{`"age": 42,
"price": 19.99,
"discount": -5`}</code>
              </pre>
              <p className={styles.note}>
                Note: numbers above 9 × 10<sup>15</sup> (more than 16 digits)
                lose precision when JavaScript parses them. easyjson shows a
                warning when this happens. If you need the exact value, store
                it as a <code>string</code>.
              </p>
            </div>

            <div className={styles.typeBlock}>
              <div className={styles.typeHead}>
                <span className={`${styles.typeChip} ${styles.tBool}`}>
                  boolean
                </span>
                <span className={styles.typeSyn}>
                  synonym: yes/no, on/off, toggle
                </span>
              </div>
              <p>Exactly two states: <code>true</code> or <code>false</code>. No quotes.</p>
              <pre className={styles.example}>
                <code>{`"active": true,
"deleted": false`}</code>
              </pre>
            </div>

            <div className={styles.typeBlock}>
              <div className={styles.typeHead}>
                <span className={`${styles.typeChip} ${styles.tNull}`}>
                  null
                </span>
                <span className={styles.typeSyn}>
                  synonym: empty, unset, none
                </span>
              </div>
              <p>
                Explicitly &quot;no value&quot;. Important: this is different
                from an empty string (<code>&quot;&quot;</code>) or the number
                zero. <code>null</code> means the field has been intentionally
                left blank.
              </p>
              <pre className={styles.example}>
                <code>{`"deleted_at": null,
"middle_name": null`}</code>
              </pre>
            </div>

            <div className={styles.typeBlock}>
              <div className={styles.typeHead}>
                <span className={`${styles.typeChip} ${styles.tObject}`}>
                  object
                </span>
                <span className={styles.typeSyn}>
                  synonym: record, dictionary, group
                </span>
              </div>
              <p>
                A group of named fields wrapped in <code>{"{ }"}</code>.
                Objects can contain other objects, arrays, or any primitive
                value.
              </p>
              <pre className={styles.example}>
                <code>{`"address": {
  "city": "Buenos Aires",
  "country": "AR",
  "zip": "C1414"
}`}</code>
              </pre>
            </div>

            <div className={styles.typeBlock}>
              <div className={styles.typeHead}>
                <span className={`${styles.typeChip} ${styles.tArray}`}>
                  array
                </span>
                <span className={styles.typeSyn}>
                  synonym: list, collection
                </span>
              </div>
              <p>
                An ordered series of values wrapped in <code>[ ]</code>. Items
                can be of any type, including more arrays or objects.
              </p>
              <pre className={styles.example}>
                <code>{`"tags": ["startup", "saas", "remote"],
"prices": [29, 99, 199],
"team": [
  { "name": "Ana", "role": "CEO" },
  { "name": "Beto", "role": "CTO" }
]`}</code>
              </pre>
            </div>
          </section>

          <section className={styles.section}>
            <span className={styles.eyebrow}>03 — Smart text fields</span>
            <h3>Recognised string formats</h3>
            <p className={styles.lead}>
              When a string matches a known pattern, easyjson renders a
              friendlier input. The data is still a <code>string</code> under
              the hood — only the input changes.
            </p>

            <dl className={styles.smartList}>
              <div>
                <dt>Date</dt>
                <dd>
                  <p>
                    Format <code>yyyy-mm-dd</code> → calendar picker.
                  </p>
                  <pre className={styles.example}>
                    <code>{`"founded": "2018-03-15"`}</code>
                  </pre>
                </dd>
              </div>
              <div>
                <dt>Datetime</dt>
                <dd>
                  <p>
                    ISO 8601 timestamps → calendar + time picker. Timezone (
                    <code>Z</code>, <code>+03:00</code>, etc.) is preserved.
                  </p>
                  <pre className={styles.example}>
                    <code>{`"created_at": "2026-09-01T10:30:00Z"
"meeting":    "2026-09-05T15:45:00-03:00"`}</code>
                  </pre>
                </dd>
              </div>
              <div>
                <dt>Time</dt>
                <dd>
                  <p>
                    <code>HH:MM</code> or <code>HH:MM:SS</code> → time picker.
                  </p>
                  <pre className={styles.example}>
                    <code>{`"opens_at":  "09:30"
"closes_at": "18:00:45"`}</code>
                  </pre>
                </dd>
              </div>
              <div>
                <dt>Color</dt>
                <dd>
                  <p>
                    Hex starting with <code>#</code> (3, 4, 6, or 8 digits) →
                    swatch + native color picker.
                  </p>
                  <pre className={styles.example}>
                    <code>{`"primary":   "#FF0066"
"secondary": "#1877f2"
"overlay":   "#000000aa"`}</code>
                  </pre>
                </dd>
              </div>
              <div>
                <dt>URL</dt>
                <dd>
                  <p>
                    Anything starting with <code>http://</code> or{" "}
                    <code>https://</code> → input with an{" "}
                    <span className={styles.iconHint}>↗</span> button to open in
                    a new tab.
                  </p>
                  <pre className={styles.example}>
                    <code>{`"site": "https://acme.com/launch"`}</code>
                  </pre>
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <p>
                    Anything looking like an address → input with a{" "}
                    <span className={styles.iconHint}>✉</span> button to open
                    your email client.
                  </p>
                  <pre className={styles.example}>
                    <code>{`"contact": "team@acme.com"`}</code>
                  </pre>
                </dd>
              </div>
              <div>
                <dt>UUID</dt>
                <dd>
                  <p>
                    The 36-character dashed identifier (8-4-4-4-12) → monospaced
                    input with a UUID tag.
                  </p>
                  <pre className={styles.example}>
                    <code>{`"id": "550e8400-e29b-41d4-a716-446655440000"`}</code>
                  </pre>
                </dd>
              </div>
            </dl>

            <p className={styles.note}>
              If you edit a smart field and break its format, it gracefully
              falls back to a plain text input.
            </p>
          </section>

          <section className={styles.section}>
            <span className={styles.eyebrow}>04 — Workspace</span>
            <h3>Two columns, one source of truth</h3>
            <p className={styles.lead}>
              The screen is split into a tree on the left and an editor on the
              right. They stay in sync: any change on the right updates the
              tree, and clicking the tree updates the editor.
            </p>

            <h4 className={styles.subhead}>Left — the tree</h4>
            <p>
              Shows the structure of your JSON. Click any row to open it on the
              right. Click the arrow to expand or collapse a group/list. Use
              the search box at the top to filter fields by name — matches are
              highlighted, and the tree auto-expands to reveal them.
            </p>

            <h4 className={styles.subhead}>Right — the editor</h4>
            <p>
              The form for whatever you clicked. The breadcrumb at the top
              shows where you are in the structure. If the node is a single
              value, you see one input. If it&apos;s an object or array, you
              see one row per child.
            </p>
          </section>

          <section className={styles.section}>
            <span className={styles.eyebrow}>05 — Modes</span>
            <h3>How you interact with the JSON</h3>
            <p className={styles.lead}>
              Three modes control what you can do. They&apos;re independent of
              the data — switching mode never modifies the JSON.
            </p>

            <div className={styles.modeBlock}>
              <h4 className={styles.subhead}>Default</h4>
              <p>
                You can edit values but not the structure. Renaming, deleting,
                adding fields, and changing types are all hidden. The safest
                mode for someone who just needs to fill in or update values.
              </p>
            </div>

            <div className={styles.modeBlock}>
              <h4 className={styles.subhead}>
                <DemoLock locked /> Read only
              </h4>
              <p>
                Everything is disabled. The form still renders but nothing
                accepts input. Useful when you only need to inspect the JSON —
                for example, comparing against another file or showing it to
                someone — without risk of accidental changes.
              </p>
            </div>

            <div className={styles.modeBlock}>
              <h4 className={styles.subhead}>
                <DemoAdvanced active /> Advanced
              </h4>
              <p>Unlocks the full editing toolkit per field:</p>
              <ul>
                <li>
                  <strong>Rename</strong> a field by clicking its dashed name (a
                  pencil icon hints this).
                </li>
                <li>
                  <strong>Delete</strong> a field or item with the{" "}
                  <code>×</code> button. Non-empty containers ask for
                  confirmation.
                </li>
                <li>
                  <strong>Duplicate</strong> with the <code>⎘</code> button. The
                  copy is selected automatically.
                </li>
                <li>
                  <strong>Reorder</strong> array items with{" "}
                  <code>↑ ↓</code> buttons.
                </li>
                <li>
                  <strong>Change type</strong> via the dropdown next to each
                  value. easyjson tries to convert the value sensibly (e.g.{" "}
                  <code>&quot;42&quot;</code> → <code>42</code>).
                </li>
                <li>
                  <strong>Add new fields</strong> at the bottom of objects, or
                  new items at the end of arrays.
                </li>
              </ul>
              <p className={styles.note}>
                Disabled while Read only is on.
              </p>
            </div>
          </section>

          <section className={styles.section}>
            <span className={styles.eyebrow}>06 — Toolbar</span>
            <h3>What each header button does</h3>

            <dl className={styles.smartList}>
              <div>
                <dt>
                  <DemoViewToggle />
                </dt>
                <dd>
                  <p>
                    Switch between the friendly form editor and the actual
                    JSON text. Raw view is read-only and includes a{" "}
                    <strong>Copy</strong> button to grab the full content.
                    Useful to verify your changes before downloading.
                  </p>
                </dd>
              </div>
              <div>
                <dt>
                  <DemoModeGroup />
                </dt>
                <dd>
                  <p>
                    Toggles for <strong>Read only</strong> (left) and{" "}
                    <strong>Advanced</strong> mode (right). See section 05 for
                    what each one does.
                  </p>
                </dd>
              </div>
              <div>
                <dt>
                  <DemoTheme />
                </dt>
                <dd>
                  <p>
                    Toggle light and dark mode. The icon shows the mode
                    you&apos;ll switch to. Choice persists across browser
                    sessions.
                  </p>
                </dd>
              </div>
              <div>
                <dt>
                  <DemoHelp />
                </dt>
                <dd>
                  <p>Opens this window.</p>
                </dd>
              </div>
              <div>
                <dt>
                  <DemoNew />
                </dt>
                <dd>
                  <p>
                    Discard the current JSON and start over. Asks for
                    confirmation when there&apos;s content loaded.
                  </p>
                </dd>
              </div>
              <div>
                <dt>
                  <DemoDownload />
                </dt>
                <dd>
                  <p>
                    Save the JSON to a file. The filename input in the header
                    is editable; invalid characters (
                    <code>/ \ : * ? &quot; &lt; &gt; |</code>) are sanitised
                    before saving. A yellow warning badge appears if your
                    filename has issues.
                  </p>
                </dd>
              </div>
            </dl>
          </section>

          <section className={styles.section}>
            <span className={styles.eyebrow}>07 — Tips &amp; shortcuts</span>
            <h3>Things worth knowing</h3>
            <ul className={styles.tips}>
              <li>
                <strong>Tree keyboard navigation.</strong> Click the tree, then
                use ↑ ↓ to move between fields, → to expand or enter a group,
                ← to collapse or go up, Home for root, End for the last
                visible node.
              </li>
              <li>
                <strong>Modified fields.</strong> Any value that differs from
                the loaded original gets a small ↺ icon. Click it to restore
                that field to its original value.
              </li>
              <li>
                <strong>Paste JSON.</strong> From the empty state, click{" "}
                <em>Paste JSON</em> to drop text directly without uploading a
                file. Live validation shows you if the JSON parses.
              </li>
              <li>
                <strong>Local only.</strong> Your JSON never leaves the
                browser. It&apos;s also saved to localStorage between visits,
                so you can refresh without losing work.
              </li>
              <li>
                <strong>Confirm before destructive moves.</strong> Deleting a
                non-empty group/list, or switching its type, asks for
                confirmation first.
              </li>
              <li>
                <strong>Big integers.</strong> Numbers above 9 × 10
                <sup>15</sup> lose precision in JavaScript. easyjson warns when
                this happens. Store such IDs as strings if exact value matters.
              </li>
            </ul>
          </section>
        </div>

        <footer className={styles.foot}>
          <button
            type="button"
            className={styles.closeFootBtn}
            onClick={onClose}
          >
            Got it
          </button>
        </footer>
      </div>
    </div>
  );
}

/* --- Demo clones of the real header controls ----------------------------- */

function DemoLock({ locked }: { locked: boolean }) {
  return (
    <span
      className={`${styles.demoIconBtn} ${locked ? styles.demoActive : ""}`}
      aria-hidden="true"
    >
      <LockIcon locked={locked} />
    </span>
  );
}

function DemoAdvanced({ active }: { active: boolean }) {
  return (
    <span
      className={`${styles.demoIconBtn} ${active ? styles.demoActive : ""}`}
      aria-hidden="true"
    >
      <SlidersIcon />
    </span>
  );
}

function DemoViewToggle() {
  return (
    <span className={styles.demoViewToggle} aria-hidden="true">
      <span className={`${styles.demoViewBtn} ${styles.demoViewBtnActive}`}>
        Form
      </span>
      <span className={styles.demoViewBtn}>Raw</span>
    </span>
  );
}

function DemoModeGroup() {
  return (
    <span className={styles.demoModeGroup} aria-hidden="true">
      <DemoLock locked={false} />
      <DemoAdvanced active={false} />
    </span>
  );
}

function DemoTheme() {
  return (
    <span className={styles.demoTheme} aria-hidden="true">
      <MoonIcon />
    </span>
  );
}

function DemoHelp() {
  return (
    <span className={styles.demoHelp} aria-hidden="true">
      ?
    </span>
  );
}

function DemoNew() {
  return (
    <span className={styles.demoGhost} aria-hidden="true">
      New
    </span>
  );
}

function DemoDownload() {
  return (
    <span className={styles.demoPrimary} aria-hidden="true">
      ↓ Download
    </span>
  );
}
