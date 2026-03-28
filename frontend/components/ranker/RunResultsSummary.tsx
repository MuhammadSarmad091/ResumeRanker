"use client";

import { useMemo, type ComponentType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { RankedResume } from "@/lib/types";
import { candidateKey } from "@/lib/local-data";
import { cn } from "@/lib/cn";
import {
  IconActivity,
  IconCheckCircle,
  IconLayers,
  IconMail,
  IconSparkles,
  IconTarget,
  IconUsers,
} from "@/components/icons/RrIcons";

function initials(name: string | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]!.toUpperCase()).join("");
}

function useBatchStats(ranked: RankedResume[], minScore: number) {
  return useMemo(() => {
    const scores = ranked.map((r) => r.fitScore).sort((a, b) => a - b);
    const n = scores.length;
    if (n === 0) {
      return {
        mean: 0,
        median: 0,
        aboveMin: 0,
        min: 0,
        max: 0,
        n: 0,
      };
    }
    const sum = scores.reduce((a, b) => a + b, 0);
    const mean = Math.round(sum / n);
    const mid = Math.floor(n / 2);
    const median =
      n % 2 === 1 ? scores[mid]! : Math.round((scores[mid - 1]! + scores[mid]!) / 2);
    const aboveMin = ranked.filter((r) => r.fitScore >= minScore).length;
    return {
      mean,
      median,
      aboveMin,
      min: scores[0]!,
      max: scores[n - 1]!,
      n,
    };
  }, [ranked, minScore]);
}

type Props = {
  roleTitle: string;
  ranked: RankedResume[];
  minScore: number;
  shortlistCount: number;
  onJumpToCandidate: (rankedIndex: number) => void;
};

export function RunResultsSummary({
  roleTitle,
  ranked,
  minScore,
  shortlistCount,
  onJumpToCandidate,
}: Props) {
  const reduce = useReducedMotion();
  const stats = useBatchStats(ranked, minScore);
  const top3 = ranked.slice(0, 3);
  const podiumClass = [
    "from-amber-500/15 ring-amber-500/25",
    "from-slate-400/12 ring-slate-400/20",
    "from-amber-800/12 ring-amber-800/20 dark:from-amber-600/10",
  ];

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div className="rr-card relative overflow-hidden border-[var(--rr-accent)]/20 bg-gradient-to-br from-[var(--rr-accent)]/6 via-transparent to-transparent p-6 sm:p-8">
        <IconLayers
          className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 text-[var(--rr-accent)]/[0.06]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--rr-accent)]">
              <IconCheckCircle className="h-4 w-4" aria-hidden />
              Analysis complete
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[var(--rr-fg)] sm:text-2xl">
              {roleTitle || "This role"}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--rr-muted)]">
              Batch summary for this run: how the pool looks against your JD,
              who leads the ranking, and quick access to each candidate profile
              below.
            </p>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={IconUsers}
            label="Candidates"
            value={String(stats.n)}
            hint="in this upload"
          />
          <StatTile
            icon={IconActivity}
            label="Avg fit"
            value={`${stats.mean}%`}
            hint={`range ${stats.min}–${stats.max}`}
          />
          <StatTile
            icon={IconTarget}
            label="Median"
            value={`${stats.median}%`}
            hint="middle score"
          />
          <StatTile
            icon={IconCheckCircle}
            label="Above min filter"
            value={`${stats.aboveMin}`}
            hint={`≥ ${minScore}% · ${shortlistCount} shortlisted`}
          />
        </div>
      </div>

      {top3.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--rr-fg)]">
            <IconSparkles
              className="h-4 w-4 text-amber-500 dark:text-amber-400"
              aria-hidden
            />
            Top of the ranking
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {top3.map((c, i) => (
                <button
                  key={candidateKey(c, i)}
                  type="button"
                  onClick={() => onJumpToCandidate(i)}
                  className={cn(
                    "group flex flex-col rounded-2xl border border-[var(--rr-border)] bg-gradient-to-b p-4 text-left ring-1 transition hover:border-[var(--rr-accent)]/35",
                    podiumClass[i] ?? "from-[var(--rr-hover)]/40 ring-transparent"
                  )}
                >
                  <span className="text-xs font-medium text-[var(--rr-muted)]">
                    #{i + 1} · Rank
                  </span>
                  <span className="mt-1 font-semibold text-[var(--rr-fg)] group-hover:text-[var(--rr-accent)]">
                    {c.name || "Unknown"}
                  </span>
                  <span
                    className={cn(
                      "mt-2 text-2xl font-bold tabular-nums",
                      i === 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-[var(--rr-fg)]"
                    )}
                  >
                    {c.fitScore}%
                  </span>
                  <span className="mt-2 text-xs text-[var(--rr-muted)]">
                    Jump to full profile & notes →
                  </span>
                </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--rr-fg)]">
          <IconMail className="h-4 w-4 text-[var(--rr-accent)]" aria-hidden />
          Candidates in this batch
        </h3>
        <p className="mb-3 text-xs text-[var(--rr-muted)]">
          Tap a name to scroll to their card, scores, and reviewer notes.
        </p>
        <div className="flex flex-wrap gap-2">
          {ranked.map((c, idx) => (
            <button
              key={candidateKey(c, idx)}
              type="button"
              onClick={() => onJumpToCandidate(idx)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--rr-border)] bg-[var(--rr-surface)] px-2.5 py-1.5 text-left text-xs transition hover:border-[var(--rr-accent)]/40 hover:bg-[var(--rr-hover)]"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--rr-accent)]/12 text-[10px] font-bold text-[var(--rr-accent)]">
                {initials(c.name)}
              </span>
              <span className="max-w-[140px] truncate font-medium text-[var(--rr-fg)]">
                {c.name || "Unknown"}
              </span>
              <span className="tabular-nums text-[var(--rr-muted)]">
                {c.fitScore}%
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--rr-border)]/80 bg-[var(--rr-surface)]/80 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[var(--rr-muted)]">
        <Icon className="h-4 w-4 shrink-0 text-[var(--rr-accent)]" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-1.5 text-xl font-semibold tabular-nums text-[var(--rr-fg)]">
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-[var(--rr-muted)]">{hint}</p>
    </div>
  );
}
