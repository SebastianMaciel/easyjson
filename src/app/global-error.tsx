"use client";

import { useEffect } from "react";
import styles from "./error.module.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("easyjson global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className={styles.wrap}>
          <div className={styles.card}>
            <p className={styles.code}>500</p>
            <h1 className={styles.title}>Something broke</h1>
            <p className={styles.message}>
              A critical error stopped easyjson from rendering. Try again, or
              reload the page.
            </p>
            {error.digest && (
              <p className={styles.digest}>
                Error ID: <code>{error.digest}</code>
              </p>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={reset}
              >
                Try again
              </button>
              <a href="/" className={styles.primaryBtn}>
                ← Back to easyjson
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
