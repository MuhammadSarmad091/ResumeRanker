"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useUser, usePreferences } from "@/components/providers/AppProviders";
import { getHistory, type HistoryEntry } from "@/lib/local-data";
import { getMonthlyResumeUsage } from "@/lib/usage";
import { getPlan } from "@/lib/plans";
import { useEffect, useMemo, useState } from "react";
import { IconActivity, IconArrowRight, IconCheckCircle, IconHistory, IconLayers, IconLightbulb, IconSliders, IconTag } from "@/components/icons/RrIcons";

export default function DashboardPage() {
  const { user } = useUser();
  const { preferences } = usePreferences();
  const reduce = useReducedMotion();

  const [serverHistory, setServerHistory] = useState<HistoryEntry[] | null>(null);
  const [serverUsage, setServerUsage] = useState<{ count: number; limit: number | null } | null>(null);

  useEffect(() => {
    let alive = true;
    async function loadServerData() {
      if (!user) {
        if (alive) {
          setServerHistory(null);
          setServerUsage(null);
        }
        return;
      }

      try {
        const [runsRes, usageRes] = await Promise.all([fetch("/api/v1/screenings?limit=20", { credentials: "include" }), fetch("/api/v1/usage/monthly", { credentials: "include" })]);

        if (runsRes.ok) {
          const json = (await runsRes.json()) as {
            success?: boolean;
            data?: {
              runs?: Array<{
                createdAt?: string;
                roleTitle?: string;
                resumeCount?: number;
                topScore?: number;
              }>;
            };
          };
          const rows = (json.data?.runs ?? []).map((r) => ({
            at: r.createdAt ?? new Date().toISOString(),
            roleTitle: r.roleTitle ?? "Role",
            resumeCount: Number(r.resumeCount ?? 0),
            topScore: Number(r.topScore ?? 0),
          }));
          if (alive) setServerHistory(rows);
        }

        if (usageRes.ok) {
          const json = (await usageRes.json()) as {
            success?: boolean;
            data?: { count?: number; limit?: number | null };
          };
          if (alive) {
            setServerUsage({
              count: Number(json.data?.count ?? 0),
              limit: json.data?.limit ?? null,
            });
          }
        }
      } catch {
        if (alive) {
          setServerHistory(null);
          setServerUsage(null);
        }
      }
    }
    void loadServerData();
    return () => {
      alive = false;
    };
  }, [user]);

  const history = useMemo(() => serverHistory ?? (user ? getHistory(user.id) : []), [serverHistory, user]);

  const plan = useMemo(() => getPlan(preferences.subscriptionTier), [preferences.subscriptionTier]);

  const localUsage = user ? getMonthlyResumeUsage(user.id) : { count: 0, monthKey: "" };
  const usage = {
    count: serverUsage?.count ?? localUsage.count,
    limit: serverUsage?.limit ?? plan.resumeLimitPerMonth,
  };

  const resumesProcessed = useMemo(() => {
    return history.reduce((acc, h) => acc + h.resumeCount, 0);
  }, [history]);

  const tips = ["Prefer skill and responsibility alignment over keyword density alone.", "Re-read borderline candidates; strong fits often use different wording.", "Use shortlists and notes so decisions stay consistent across reviewers."];

  return (
    <div className="space-y-10">
      <div>
        <motion.h1 initial={reduce ? false : { opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-semibold tracking-tight text-[var(--rr-fg)]">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </motion.h1>
        <p className="mt-2 max-w-xl text-sm text-[var(--rr-muted)]">Screen faster with structured JD and resume parsing, transparent section-wise scores, and subscription-aware usage.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rr-card relative overflow-hidden p-5">
          <IconTag className="pointer-events-none absolute -right-1 -top-1 h-16 w-16 text-[var(--rr-accent)]/[0.07]" aria-hidden />
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--rr-muted)]">Subscription</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--rr-fg)]">{plan.name}</p>
          <p className="mt-1 text-sm text-[var(--rr-muted)]">{plan.resumeLimitPerMonth === null ? "Unlimited analyses / month" : `Up to ${plan.resumeLimitPerMonth.toLocaleString()} analyses / month`}</p>
          <Link href="/pricing" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--rr-accent)] hover:underline">
            View plans
            <IconArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </motion.div>

        <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rr-card relative overflow-hidden p-5">
          <IconActivity className="pointer-events-none absolute -right-1 -top-1 h-16 w-16 text-[var(--rr-accent)]/[0.07]" aria-hidden />
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--rr-muted)]">Usage (this month)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--rr-fg)]">
            {usage.count}
            {usage.limit !== null && <span className="text-lg font-normal text-[var(--rr-muted)]"> / {usage.limit}</span>}
          </p>
          <p className="mt-1 text-sm text-[var(--rr-muted)]">Resumes analyzed toward your tier limit.</p>
        </motion.div>

        <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rr-card relative overflow-hidden p-5">
          <IconHistory className="pointer-events-none absolute -right-1 -top-1 h-16 w-16 text-[var(--rr-accent)]/[0.07]" aria-hidden />
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--rr-muted)]">All-time runs (local)</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-[var(--rr-fg)]">{resumesProcessed}</p>
          <p className="mt-1 text-sm text-[var(--rr-muted)]">Total resumes across saved screening runs in this browser.</p>
        </motion.div>
      </div>

      {preferences.analyticsAddOn && (
        <motion.section initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rr-card border-[var(--rr-accent)]/25 p-6">
          <h3 className="text-sm font-semibold text-[var(--rr-fg)]">Advanced analytics (add-on)</h3>
          <p className="mt-2 text-sm text-[var(--rr-muted)]">Placeholder metrics aligned with the Lean Canvas: wire these to your backend later for real cohorts and satisfaction surveys.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--rr-hover)]/60 px-4 py-3">
              <p className="text-xs text-[var(--rr-muted)]">Est. time saved</p>
              <p className="mt-1 text-lg font-semibold text-[var(--rr-fg)]">~{Math.max(1, Math.round(resumesProcessed * 0.25))}h</p>
              <p className="text-xs text-[var(--rr-muted)]">vs manual skim</p>
            </div>
            <div className="rounded-xl bg-[var(--rr-hover)]/60 px-4 py-3">
              <p className="text-xs text-[var(--rr-muted)]">Satisfaction</p>
              <p className="mt-1 text-lg font-semibold text-[var(--rr-fg)]">4.6 / 5</p>
              <p className="text-xs text-[var(--rr-muted)]">demo rating</p>
            </div>
            <div className="rounded-xl bg-[var(--rr-hover)]/60 px-4 py-3">
              <p className="text-xs text-[var(--rr-muted)]">Interview lift</p>
              <p className="mt-1 text-lg font-semibold text-[var(--rr-fg)]">+12%</p>
              <p className="text-xs text-[var(--rr-muted)]">demo benchmark</p>
            </div>
          </div>
        </motion.section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Link href="/rank" className="rr-card group relative block overflow-hidden p-6 transition hover:border-[var(--rr-accent)]/35">
            <IconLayers className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 text-[var(--rr-accent)]/[0.08] transition group-hover:text-[var(--rr-accent)]/12" aria-hidden />
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--rr-accent)]">Primary workflow</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--rr-fg)]">Rank resumes</h2>
            <p className="mt-2 text-sm text-[var(--rr-muted)]">Upload a JD PDF and resumes. AI extracts fields; section-wise scores roll up to a transparent overall fit.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--rr-accent)]">
              Open ranker
              <IconArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </motion.div>

        <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Link href="/settings" className="rr-card group relative block overflow-hidden p-6 transition hover:border-[var(--rr-accent)]/35">
            <IconSliders className="pointer-events-none absolute -right-2 -top-2 h-20 w-20 text-[var(--rr-muted)]/[0.12] transition group-hover:text-[var(--rr-accent)]/15" aria-hidden />
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--rr-muted)]">Workspace</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--rr-fg)]">Preferences</h2>
            <p className="mt-2 text-sm text-[var(--rr-muted)]">Tier, section weights, parser URL, theme, and analytics add-on.</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--rr-fg)]">
              Configure
              <IconArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        </motion.div>
      </div>

      {preferences.emailScreeningTips && (
        <motion.section initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="rr-card border-dashed p-6">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--rr-fg)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--rr-accent)]/10 text-[var(--rr-accent)]">
              <IconLightbulb className="h-4 w-4" aria-hidden />
            </span>
            Fair screening reminders
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--rr-muted)]">
            {tips.map((t) => (
              <li key={t} className="flex gap-2">
                <IconCheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--rr-accent)]/70" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      <section>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--rr-fg)]">
          <IconHistory className="h-4 w-4 text-[var(--rr-accent)]" aria-hidden />
          Recent runs
        </h3>
        <p className="mt-1 text-xs text-[var(--rr-muted)]">Stored locally in your browser for this account.</p>
        {history.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--rr-muted)]">
            No runs yet. Start from{" "}
            <Link href="/rank" className="text-[var(--rr-accent)] underline-offset-2 hover:underline">
              Rank resumes
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {history.slice(0, 8).map((h) => (
              <li key={h.at} className="flex items-center justify-between rounded-xl border border-[var(--rr-border)] bg-[var(--rr-surface)] px-4 py-3 text-sm">
                <span className="font-medium text-[var(--rr-fg)]">{h.roleTitle || "Untitled role"}</span>
                <span className="text-[var(--rr-muted)]">
                  {h.resumeCount} resumes · top {h.topScore}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
