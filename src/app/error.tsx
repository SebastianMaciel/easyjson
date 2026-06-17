"use client";

import { useEffect } from "react";
import Link from "next/link";
import styles from "./error.module.css";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("easyjson runtime error", error);
  }, [error]);

  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.code}>500</p>
        <h1 className={styles.title}>Something broke</h1>
        <p className={styles.message}>
          An unexpected error occurred. Your JSON is still saved locally — you
          can try again or go back home.
        </p>
        {error.message && (
          <pre className={styles.errorDetail}>
            <code>{error.message}</code>
          </pre>
        )}
        {error.digest && (
          <p className={styles.digest}>
            Error ID: <code>{error.digest}</code>
          </p>
        )}
        <div className={styles.actions}>
          <button type="button" className={styles.ghostBtn} onClick={reset}>
            Try again
          </button>
          <Link href="/" className={styles.primaryBtn}>
            ← Back to easyjson
          </Link>
        </div>
      </div>
    </main>
  );
}
