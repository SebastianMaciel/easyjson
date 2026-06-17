"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./ConfirmDialog.module.css";

type Variant = "default" | "danger";

type Options = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
};

type Pending = Options & {
  resolve: (ok: boolean) => void;
};

const ConfirmContext = createContext<((o: Options) => Promise<boolean>) | null>(
  null,
);

export function useConfirm(): (o: Options) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback(
    (opts: Options) =>
      new Promise<boolean>((resolve) => {
        setPending({ ...opts, resolve });
      }),
    [],
  );

  const close = useCallback(
    (ok: boolean) => {
      if (!pending) return;
      pending.resolve(ok);
      setPending(null);
    },
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    confirmBtnRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        close(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, close]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending && (
        <div
          className={styles.backdrop}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby={pending.description ? "confirm-desc" : undefined}
          onClick={(e) => {
            if (e.target === e.currentTarget) close(false);
          }}
        >
          <div className={styles.dialog}>
            <h2 id="confirm-title" className={styles.title}>
              {pending.title}
            </h2>
            {pending.description && (
              <p id="confirm-desc" className={styles.description}>
                {pending.description}
              </p>
            )}
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => close(false)}
              >
                {pending.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmBtnRef}
                type="button"
                className={`${styles.confirmBtn} ${
                  pending.variant === "danger" ? styles.danger : ""
                }`}
                onClick={() => close(true)}
              >
                {pending.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
