import Link from "next/link";
import styles from "./error.module.css";

export default function NotFound() {
  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Page not found</h1>
        <p className={styles.message}>
          The URL you tried doesn&apos;t exist in easyjson. It may have been
          mistyped or removed.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            ← Back to easyjson
          </Link>
        </div>
      </div>
    </main>
  );
}
