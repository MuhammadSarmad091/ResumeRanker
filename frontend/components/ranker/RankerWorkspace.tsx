"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { uploadResumeBundle } from "@/lib/api";
import { rankResumesAgainstJd } from "@/lib/score";
import type {
  ParsedJobDescription,
  ParsedResume,
  RankedResume,
  SectionScores,
} from "@/lib/types";
import type { SectionWeights } from "@/lib/prefs";
import { getPlan } from "@/lib/plans";
import {
  addMonthlyResumeUsage,
  canProcessResumes,
  getMonthlyResumeUsage,
} from "@/lib/usage";
import {
  candidateKey,
  getNotes,
  getShortlist,
  pushHistory,
  setNotes,
  setShortlist,
} from "@/lib/local-data";
import { useUser, usePreferences } from "@/components/providers/AppProviders";
import { cn } from "@/lib/cn";
import { ProcessingPanel } from "@/components/ranker/ProcessingPanel";
import { RunResultsSummary } from "@/components/ranker/RunResultsSummary";

const SECTION_ROWS: { key: keyof SectionScores; label: string }[] = [
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
];

function SectionBreakdown({ scores }: { scores: SectionScores }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase text-[var(--rr-muted)]">
        Section scores (0–100)
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SECTION_ROWS.map(({ key, label }) => (
          <div key={key}>
            <div className="mb-1 flex justify-between text-xs text-[var(--rr-muted)]">
              <span>{label}</span>
              <span className="tabular-nums text-[var(--rr-fg)]">
                {scores[key]}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[var(--rr-hover)]">
              <div
                className="h-full rounded-full bg-[var(--rr-accent)]/90"
                style={{ width: `${scores[key]}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function scoreTone(score: number): string {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

function scoreBarBg(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

export default function RankerWorkspace() {
  const { user } = useUser();
  const { preferences } = usePreferences();
  const reduce = useReducedMotion();
  const userId = user?.id ?? "guest";

  const [jdFile, setJdFile] = useState<File | null>(null);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [raw, setRaw] = useState<{
    jd: ParsedJobDescription;
    resumes: ParsedResume[];
  } | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [minScore, setMinScore] = useState(preferences.defaultMinScore);
  const [sortBy, setSortBy] = useState<"score" | "name">("score");
  const [shortlist, setShortlistState] = useState<string[]>([]);
  const [notes, setNotesState] = useState<Record<string, string>>({});
  const [compareKeys, setCompareKeys] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [useRunWeightsOverride, setUseRunWeightsOverride] = useState(false);
  const [runWeights, setRunWeights] = useState<SectionWeights>(() => ({
    ...preferences.sectionWeights,
  }));
  const [, bumpUsageDisplay] = useState(0);

  useEffect(() => {
    setRunWeights({ ...preferences.sectionWeights });
  }, [preferences.sectionWeights]);

  useEffect(() => {
    setMinScore(preferences.defaultMinScore);
  }, [preferences.defaultMinScore]);

  useEffect(() => {
    setShortlistState(getShortlist(userId));
    setNotesState(getNotes(userId));
  }, [userId]);

  const effectiveWeights = useMemo(
    () =>
      useRunWeightsOverride ? runWeights : preferences.sectionWeights,
    [useRunWeightsOverride, runWeights, preferences.sectionWeights]
  );

  const plan = useMemo(
    () => getPlan(preferences.subscriptionTier),
    [preferences.subscriptionTier]
  );

  const ranked = useMemo(() => {
    if (!raw) return [];
    return rankResumesAgainstJd(raw.jd, raw.resumes, effectiveWeights);
  }, [raw, effectiveWeights]);

  const usageSnapshot = getMonthlyResumeUsage(userId);

  const filteredSorted = useMemo(() => {
    let list = ranked.filter((c) => c.fitScore >= minScore);
    if (sortBy === "name") {
      list = [...list].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", undefined, {
          sensitivity: "base",
        })
      );
    }
    return list;
  }, [ranked, minScore, sortBy]);

  const persistShortlist = useCallback(
    (keys: string[]) => {
      setShortlistState(keys);
      setShortlist(userId, keys);
    },
    [userId]
  );

  const persistNotes = useCallback(
    (next: Record<string, string>) => {
      setNotesState(next);
      setNotes(userId, next);
    },
    [userId]
  );

  const toggleShortlist = useCallback(
    (key: string) => {
      const has = shortlist.includes(key);
      persistShortlist(
        has ? shortlist.filter((k) => k !== key) : [...shortlist, key]
      );
    },
    [shortlist, persistShortlist]
  );

  const toggleCompare = useCallback((key: string) => {
    setCompareKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= 2) return [prev[1]!, key];
      return [...prev, key];
    });
  }, []);

  const canSubmit = jdFile && resumeFiles.length > 0 && !loading;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!jdFile || resumeFiles.length === 0) return;
      const n = resumeFiles.length;
      const gate = canProcessResumes(
        userId,
        preferences.subscriptionTier,
        n
      );
      if (!gate.ok) {
        setError(
          `Monthly limit reached (${gate.used}/${gate.limit} resumes). Upgrade your plan in Settings or Pricing.`
        );
        return;
      }
      setLoading(true);
      setError(null);
      setRaw(null);
      setExpanded({});
      setCompareKeys([]);
      try {
        const apiUrl = preferences.apiBaseUrl.trim() || undefined;
        const data = await uploadResumeBundle(jdFile, resumeFiles, apiUrl);
        const jd = data.job_description ?? {};
        const resumes = data.resumes ?? [];
        setRaw({ jd, resumes });
        const rankedNow = rankResumesAgainstJd(jd, resumes, effectiveWeights);
        const top = rankedNow[0]?.fitScore ?? 0;
        addMonthlyResumeUsage(userId, n);
        bumpUsageDisplay((v) => v + 1);
        pushHistory(userId, {
          at: new Date().toISOString(),
          roleTitle: jd.title ?? "Role",
          resumeCount: resumes.length,
          topScore: top,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
      }
    },
    [
      jdFile,
      resumeFiles,
      preferences.apiBaseUrl,
      preferences.subscriptionTier,
      userId,
      effectiveWeights,
    ]
  );

  const exportCsv = useCallback(() => {
    const rows = [
      [
        "rank",
        "name",
        "email",
        "fit_score",
        "skills_sec",
        "experience_sec",
        "education_sec",
        "projects_sec",
        "certifications_sec",
        "shortlisted",
        "notes",
      ].join(","),
      ...ranked.map((c, i) => {
        const key = candidateKey(c, i);
        const s = c.sectionScores;
        return [
          c.rank,
          csv(c.name ?? ""),
          csv(c.email ?? ""),
          c.fitScore,
          s.skills,
          s.experience,
          s.education,
          s.projects,
          s.certifications,
          shortlist.includes(key) ? "yes" : "no",
          csv(notes[key] ?? ""),
        ].join(",");
      }),
    ];
    const blob = new Blob([rows.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `resume-ranker-export-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [ranked, shortlist, notes]);

  const jdSkillsPreview = useMemo(
    () => (raw?.jd.skills ?? []).slice(0, 16),
    [raw]
  );

  const compareCandidates = useMemo(() => {
    const out: { key: string; c: RankedResume; index: number }[] = [];
    for (const k of compareKeys) {
      const idx = ranked.findIndex((c, i) => candidateKey(c, i) === k);
      if (idx >= 0) {
        out.push({ key: k, c: ranked[idx]!, index: idx });
      }
    }
    return out;
  }, [compareKeys, ranked]);

  const jumpToCandidate = useCallback((rankedIndex: number) => {
    const el = document.getElementById(`rr-candidate-${rankedIndex}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--rr-fg)]">
          Rank resumes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--rr-muted)]">
          Structured parsing runs on your FastAPI service; section-wise scores
          combine into an overall fit. Shortlists and notes stay in this
          workspace.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--rr-muted)]">
          <span className="rounded-full border border-[var(--rr-border)] bg-[var(--rr-surface)] px-3 py-1">
            Plan: <strong className="text-[var(--rr-fg)]">{plan.name}</strong>
          </span>
          {plan.resumeLimitPerMonth !== null ? (
            <span className="rounded-full border border-[var(--rr-border)] bg-[var(--rr-surface)] px-3 py-1">
              This month:{" "}
              <strong className="text-[var(--rr-fg)]">
                {usageSnapshot.count} / {plan.resumeLimitPerMonth}
              </strong>{" "}
              resumes analyzed
            </span>
          ) : (
            <span className="rounded-full border border-[var(--rr-border)] bg-[var(--rr-surface)] px-3 py-1">
              Enterprise — usage not capped in-app
            </span>
          )}
          <Link
            href="/pricing"
            className="text-[var(--rr-accent)] underline-offset-2 hover:underline"
          >
            Plans & limits
          </Link>
        </div>
      </div>

      <motion.section
        layout
        className="rr-card overflow-hidden p-6 sm:p-8"
      >
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--rr-fg)]">
                Job description PDF
              </span>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  setJdFile(e.target.files?.[0] ?? null);
                  setError(null);
                }}
                className="rr-file-input"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-[var(--rr-fg)]">
                Resume PDFs
              </span>
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={(e) => {
                  const list = e.target.files
                    ? Array.from(e.target.files)
                    : [];
                  setResumeFiles(list);
                  setError(null);
                }}
                className="rr-file-input"
              />
            </label>
          </div>

          <div className="rounded-xl border border-dashed border-[var(--rr-border)] bg-[var(--rr-bg)]/50 p-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[var(--rr-fg)]">
              <input
                type="checkbox"
                checked={useRunWeightsOverride}
                onChange={(e) => setUseRunWeightsOverride(e.target.checked)}
                className="h-4 w-4 accent-[var(--rr-accent)]"
              />
              Custom section weights for this run only
            </label>
            <p className="mt-1 text-xs text-[var(--rr-muted)]">
              Override saved preferences for this job (Lean Canvas: weights per
              job type). Uncheck to use Settings defaults.
            </p>
            {useRunWeightsOverride && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {SECTION_ROWS.map(({ key, label }) => (
                  <label key={key} className="flex flex-col gap-1 text-xs">
                    <span className="text-[var(--rr-muted)]">{label}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={runWeights[key]}
                      onChange={(e) =>
                        setRunWeights((w) => ({
                          ...w,
                          [key]: Number(e.target.value),
                        }))
                      }
                      className="rounded-lg border border-[var(--rr-border)] bg-[var(--rr-surface)] px-2 py-1.5 text-[var(--rr-fg)]"
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && (
            <motion.div
              role="alert"
              initial={reduce ? false : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100"
            >
              {error}
            </motion.div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-[var(--rr-accent)] px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-[var(--rr-accent)]/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Parsing…" : "Run analysis"}
            </button>
            {ranked.length > 0 && (
              <button
                type="button"
                onClick={exportCsv}
                className="rounded-xl border border-[var(--rr-border)] px-4 py-2.5 text-sm font-medium text-[var(--rr-fg)] transition hover:bg-[var(--rr-hover)]"
              >
                Export CSV
              </button>
            )}
            {compareKeys.length === 2 && (
              <button
                type="button"
                onClick={() => setShowCompare(true)}
                className="rounded-xl border border-[var(--rr-border)] px-4 py-2.5 text-sm font-medium text-[var(--rr-fg)] transition hover:bg-[var(--rr-hover)]"
              >
                Compare two
              </button>
            )}
          </div>

          <ProcessingPanel active={loading} />
        </form>
      </motion.section>

      {raw && ranked.length > 0 && (
        <RunResultsSummary
          roleTitle={raw.jd.title || "Untitled role"}
          ranked={ranked}
          minScore={minScore}
          shortlistCount={shortlist.length}
          onJumpToCandidate={jumpToCandidate}
        />
      )}

      {preferences.showFairnessPanel && raw && (
        <motion.section
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rr-card border-dashed p-5"
        >
          <h3 className="text-sm font-semibold text-[var(--rr-fg)]">
            Transparency
          </h3>
          <p className="mt-2 text-sm text-[var(--rr-muted)]">
            Overall fit is a weighted blend of section scores (skills, experience,
            education, projects, certifications) using{" "}
            {useRunWeightsOverride ? "this run’s" : "your saved"} weights:{" "}
            {SECTION_ROWS.map(({ key, label }, idx) => (
              <span key={key}>
                {idx > 0 ? " · " : ""}
                {label} {effectiveWeights[key]}%
              </span>
            ))}
            . Transparent structured scoring—not a black box. This is a
            screening aid, not legal or compliance advice.
          </p>
        </motion.section>
      )}

      {raw && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--rr-fg)]">
            Parsed job description
          </h2>
          <div className="rr-card p-6">
            <p className="text-xl font-medium text-[var(--rr-fg)]">
              {raw.jd.title || "Untitled role"}
            </p>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-[var(--rr-muted)]">
                  Experience
                </dt>
                <dd className="mt-1 text-[var(--rr-fg)]">
                  {raw.jd.experience || "—"}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[var(--rr-muted)]">
                  Education
                </dt>
                <dd className="mt-1 text-[var(--rr-fg)]">
                  {raw.jd.education || "—"}
                </dd>
              </div>
            </dl>
            {jdSkillsPreview.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--rr-muted)]">
                  Skills
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {jdSkillsPreview.map((s) => (
                    <li
                      key={s}
                      className="rounded-full bg-[var(--rr-hover)] px-3 py-1 text-xs text-[var(--rr-fg)]"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {ranked.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--rr-fg)]">
                Ranked candidates
              </h2>
              <p className="mt-1 text-sm text-[var(--rr-muted)]">
                {filteredSorted.length} shown (min {minScore}%) ·{" "}
                {shortlist.length} shortlisted · use chips above to jump
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 text-sm text-[var(--rr-muted)]">
                Min score
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="accent-[var(--rr-accent)]"
                />
                <span className="tabular-nums text-[var(--rr-fg)]">
                  {minScore}%
                </span>
              </label>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "score" | "name")
                }
                className="rounded-xl border border-[var(--rr-border)] bg-[var(--rr-surface)] px-3 py-2 text-sm text-[var(--rr-fg)]"
              >
                <option value="score">Sort by score</option>
                <option value="name">Sort by name</option>
              </select>
            </div>
          </div>

          <ul className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {filteredSorted.map((c, listIndex) => {
                const origIndex = ranked.indexOf(c);
                const key = candidateKey(c, origIndex);
                const isShort = shortlist.includes(key);
                const isCompare = compareKeys.includes(key);
                const compact = preferences.compactRankCards;
                return (
                  <motion.li
                    id={`rr-candidate-${origIndex}`}
                    key={key}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{
                      duration: 0.22,
                      ease: [0.22, 1, 0.36, 1],
                      layout: { duration: 0.2 },
                    }}
                    className="overflow-hidden rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-surface)]"
                  >
                    <div
                      className={cn(
                        "flex flex-col gap-3 sm:flex-row sm:items-stretch",
                        compact ? "p-4" : "p-5"
                      )}
                    >
                      <div className="flex flex-1 gap-3">
                        <button
                          type="button"
                          title={
                            isShort ? "Remove from shortlist" : "Shortlist"
                          }
                          onClick={() => toggleShortlist(key)}
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg transition",
                            isShort
                              ? "border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                              : "border-[var(--rr-border)] text-[var(--rr-muted)] hover:border-[var(--rr-accent)]/40"
                          )}
                        >
                          {isShort ? "★" : "☆"}
                        </button>
                        <button
                          type="button"
                          title="Pick for compare (max 2)"
                          onClick={() => toggleCompare(key)}
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-xs font-semibold transition",
                            isCompare
                              ? "border-[var(--rr-accent)] bg-[var(--rr-accent-muted)] text-[var(--rr-accent)]"
                              : "border-[var(--rr-border)] text-[var(--rr-muted)] hover:border-[var(--rr-accent)]/40"
                          )}
                          disabled={!isCompare && compareKeys.length >= 2}
                        >
                          VS
                        </button>
                        <div className="min-w-0 flex-1 text-left">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="rounded-lg bg-[var(--rr-hover)] px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--rr-muted)]">
                              #{listIndex + 1}
                            </span>
                            <span className="font-medium text-[var(--rr-fg)]">
                              {c.name || "Unknown"}
                            </span>
                            {c.email && (
                              <span className="truncate text-sm text-[var(--rr-muted)]">
                                {c.email}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="h-2 flex-1 max-w-[200px] overflow-hidden rounded-full bg-[var(--rr-hover)]">
                              <motion.div
                                className={cn(
                                  "h-full rounded-full",
                                  scoreBarBg(c.fitScore)
                                )}
                                initial={reduce ? false : { width: 0 }}
                                animate={{ width: `${c.fitScore}%` }}
                                transition={{
                                  duration: 0.5,
                                  ease: [0.22, 1, 0.36, 1],
                                }}
                              />
                            </div>
                            <span
                              className={cn(
                                "text-sm font-semibold tabular-nums",
                                scoreTone(c.fitScore)
                              )}
                            >
                              {c.fitScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:w-52">
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded((p) => ({
                              ...p,
                              [key]: !p[key],
                            }))
                          }
                          className="rounded-xl border border-[var(--rr-border)] px-3 py-2 text-sm text-[var(--rr-fg)] hover:bg-[var(--rr-hover)]"
                        >
                          {expanded[key] ? "Hide detail" : "Detail & notes"}
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {expanded[key] && (
                        <motion.div
                          initial={reduce ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="border-t border-[var(--rr-border)]"
                        >
                          <div className="space-y-4 p-5">
                            <SectionBreakdown scores={c.sectionScores} />
                            <label className="block text-xs font-medium uppercase text-[var(--rr-muted)]">
                              Reviewer notes
                              <textarea
                                value={notes[key] ?? ""}
                                onChange={(e) =>
                                  persistNotes({
                                    ...notes,
                                    [key]: e.target.value,
                                  })
                                }
                                rows={3}
                                className="mt-2 w-full rounded-xl border border-[var(--rr-border)] bg-[var(--rr-bg)] px-3 py-2 text-sm text-[var(--rr-fg)] outline-none focus:border-[var(--rr-accent)]/50"
                                placeholder="Impressions, follow-ups, bias checks…"
                              />
                            </label>
                            <div className="grid gap-4 sm:grid-cols-2 text-sm">
                              <div>
                                <p className="text-xs font-medium uppercase text-[var(--rr-muted)]">
                                  Matched skills
                                </p>
                                <ul className="mt-2 flex flex-wrap gap-1.5">
                                  {(c.matchedSkills ?? []).length ? (
                                    c.matchedSkills.map((s) => (
                                      <li
                                        key={s}
                                        className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-800 dark:text-emerald-200"
                                      >
                                        {s}
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-[var(--rr-muted)]">
                                      None
                                    </li>
                                  )}
                                </ul>
                              </div>
                              <div>
                                <p className="text-xs font-medium uppercase text-[var(--rr-muted)]">
                                  Gaps vs JD
                                </p>
                                <ul className="mt-2 flex flex-wrap gap-1.5">
                                  {(c.missingSkills ?? []).length ? (
                                    c.missingSkills.map((s) => (
                                      <li
                                        key={s}
                                        className="rounded-md bg-rose-500/10 px-2 py-0.5 text-xs text-rose-800 dark:text-rose-200"
                                      >
                                        {s}
                                      </li>
                                    ))
                                  ) : (
                                    <li className="text-[var(--rr-muted)]">
                                      None
                                    </li>
                                  )}
                                </ul>
                              </div>
                            </div>
                            {(c.experience ?? []).length > 0 && (
                              <div>
                                <p className="text-xs font-medium uppercase text-[var(--rr-muted)]">
                                  Experience
                                </p>
                                <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--rr-fg)]">
                                  {c.experience!.map((line, i) => (
                                    <li key={i}>{line}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </section>
      )}

      <AnimatePresence>
        {showCompare && compareCandidates.length === 2 && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCompare(false)}
          >
            <motion.div
              initial={reduce ? false : { scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl border border-[var(--rr-border)] bg-[var(--rr-surface)] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[var(--rr-fg)]">
                  Side-by-side
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCompare(false)}
                  className="rounded-lg px-3 py-1 text-sm text-[var(--rr-muted)] hover:bg-[var(--rr-hover)]"
                >
                  Close
                </button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {compareCandidates.map(({ c, key }) => (
                  <div
                    key={key}
                    className="rounded-xl border border-[var(--rr-border)] p-4"
                  >
                    <p className="font-medium text-[var(--rr-fg)]">
                      {c.name}
                    </p>
                    <p className={cn("mt-2 text-2xl font-semibold", scoreTone(c.fitScore))}>
                      {c.fitScore}%
                    </p>
                    <p className="mt-2 text-xs text-[var(--rr-muted)]">
                      Matched {c.matchedSkills?.length ?? 0} /{" "}
                      {(c.matchedSkills?.length ?? 0) +
                        (c.missingSkills?.length ?? 0)}{" "}
                      JD skills
                    </p>
                    <div className="mt-4 border-t border-[var(--rr-border)] pt-4">
                      <SectionBreakdown scores={c.sectionScores} />
                    </div>
                    <p className="mt-4 text-xs font-medium uppercase text-[var(--rr-muted)]">
                      Notes
                    </p>
                    <p className="mt-1 text-sm text-[var(--rr-fg)]">
                      {notes[key] || "—"}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function csv(s: string) {
  const needs = /[",\n]/.test(s);
  const esc = s.replace(/"/g, '""');
  return needs ? `"${esc}"` : esc;
}
