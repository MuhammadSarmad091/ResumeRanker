"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { IconZap } from "@/components/icons/RrIcons";

const STEPS = [
  "Sending PDFs to the parser",
  "Extracting JD & resume fields",
  "Scoring sections & building the ranking",
] as const;

/** 0..STEPS.length: which step is active; STEPS.length = all shown complete */
export function ProcessingPanel({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) {
      setPhase(0);
      return;
    }
    setPhase(0);
    const ids = [
      window.setTimeout(() => setPhase(1), 450),
      window.setTimeout(() => setPhase(2), 950),
      window.setTimeout(() => setPhase(3), 1550),
    ];
    return () => ids.forEach(clearTimeout);
  }, [active]);

  if (!active) return null;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 rounded-2xl border border-[var(--rr-accent)]/25 bg-gradient-to-br from-[var(--rr-accent)]/8 to-transparent px-5 py-4 sm:px-6"
    >
      <div className="flex items-start gap-4">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--rr-accent)]/15 text-[var(--rr-accent)] ring-1 ring-[var(--rr-accent)]/20">
          {!reduce && (
            <span className="absolute inset-0 animate-ping rounded-xl bg-[var(--rr-accent)]/20" />
          )}
          <IconZap className="relative h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--rr-fg)]">
            Working on your batch…
          </p>
          <p className="mt-0.5 text-xs text-[var(--rr-muted)]">
            Hold tight—results, candidate summaries, and ranking will appear
            below when parsing finishes.
          </p>
          <ol className="mt-4 space-y-2">
            {STEPS.map((label, i) => {
              const done = phase > i;
              const current = phase === i;
              return (
                <li
                  key={label}
                  className="flex items-center gap-2.5 text-xs sm:text-sm"
                >
                  <span
                    className={
                      done
                        ? "text-emerald-600 dark:text-emerald-400"
                        : current
                          ? "text-[var(--rr-accent)]"
                          : "text-[var(--rr-muted)]"
                    }
                  >
                    {done ? "✓" : current ? "●" : "○"}
                  </span>
                  <span
                    className={
                      current || done
                        ? "font-medium text-[var(--rr-fg)]"
                        : "text-[var(--rr-muted)]"
                    }
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </motion.div>
  );
}
