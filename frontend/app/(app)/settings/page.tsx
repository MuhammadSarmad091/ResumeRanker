"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { usePreferences } from "@/components/providers/AppProviders";
import type { SectionWeights, UserPreferences } from "@/lib/prefs";
import { applyThemeToDocument } from "@/lib/theme";
import { getPlan, type SubscriptionTier } from "@/lib/plans";

const sectionFields: { key: keyof SectionWeights; label: string }[] = [
  { key: "skills", label: "Skills" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
];

export default function SettingsPage() {
  const { preferences, updatePreferences, loading } = usePreferences();
  const [draft, setDraft] = useState<UserPreferences>(preferences);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    const ok = await updatePreferences(draft);
    setSaving(false);
    setMsg(ok ? "Saved." : "Could not save. Try again.");
  };

  const setSectionWeight = (key: keyof SectionWeights, value: number) => {
    setDraft((d) => ({
      ...d,
      sectionWeights: { ...d.sectionWeights, [key]: value },
    }));
  };

  const plan = getPlan(draft.subscriptionTier);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--rr-fg)]">
          Preferences
        </h1>
        <p className="mt-2 text-sm text-[var(--rr-muted)]">
          Subscription tier, section weights (per Lean Canvas), parser API, and
          workspace defaults.
        </p>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rr-card space-y-8 p-6 sm:p-8"
      >
        <fieldset disabled={loading} className="space-y-4">
          <legend className="text-sm font-semibold text-[var(--rr-fg)]">
            Subscription
          </legend>
          <p className="text-sm text-[var(--rr-muted)]">
            Current: <strong className="text-[var(--rr-fg)]">{plan.name}</strong>{" "}
            —{" "}
            {plan.resumeLimitPerMonth === null
              ? "unlimited analyses / month"
              : `up to ${plan.resumeLimitPerMonth.toLocaleString()} analyses / month`}
            .{" "}
            <Link
              href="/pricing"
              className="text-[var(--rr-accent)] underline-offset-2 hover:underline"
            >
              Compare plans
            </Link>
          </p>
          <label className="flex max-w-md flex-col gap-2 text-sm">
            <span className="text-[var(--rr-muted)]">Plan (demo)</span>
            <select
              value={draft.subscriptionTier}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  subscriptionTier: e.target.value as SubscriptionTier,
                }))
              }
              className="rounded-xl border border-[var(--rr-border)] bg-[var(--rr-bg)] px-3 py-2.5 text-[var(--rr-fg)] outline-none focus:border-[var(--rr-accent)]/50"
            >
              <option value="basic">Basic</option>
              <option value="growth">Growth</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>
          <label className="flex items-center gap-3 text-sm text-[var(--rr-fg)]">
            <input
              type="checkbox"
              checked={draft.analyticsAddOn}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  analyticsAddOn: e.target.checked,
                }))
              }
              className="h-4 w-4 accent-[var(--rr-accent)]"
            />
            Advanced analytics add-on (dashboard widgets)
          </label>
        </fieldset>

        <fieldset disabled={loading} className="space-y-6">
          <legend className="text-sm font-semibold text-[var(--rr-fg)]">
            Appearance
          </legend>
          <label className="flex max-w-md flex-col gap-2 text-sm">
            <span className="text-[var(--rr-muted)]">Theme</span>
            <select
              value={draft.theme}
              onChange={async (e) => {
                const theme = e.target.value as UserPreferences["theme"];
                setDraft((d) => ({ ...d, theme }));
                applyThemeToDocument(theme);
                await updatePreferences({ theme });
              }}
              className="rounded-xl border border-[var(--rr-border)] bg-[var(--rr-bg)] px-3 py-2.5 text-[var(--rr-fg)] outline-none focus:border-[var(--rr-accent)]/50"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </fieldset>

        <fieldset disabled={loading} className="space-y-6">
          <legend className="text-sm font-semibold text-[var(--rr-fg)]">
            Parser API
          </legend>
          <label className="flex max-w-xl flex-col gap-2 text-sm">
            <span className="text-[var(--rr-muted)]">
              Backend base URL (optional)
            </span>
            <input
              type="url"
              placeholder="http://127.0.0.1:8000"
              value={draft.apiBaseUrl}
              onChange={(e) =>
                setDraft((d) => ({ ...d, apiBaseUrl: e.target.value }))
              }
              className="rounded-xl border border-[var(--rr-border)] bg-[var(--rr-bg)] px-3 py-2.5 text-[var(--rr-fg)] outline-none focus:border-[var(--rr-accent)]/50"
            />
            <span className="text-xs text-[var(--rr-muted)]">
              Leave empty to use{" "}
              <code className="rounded bg-[var(--rr-hover)] px-1">
                NEXT_PUBLIC_API_URL
              </code>{" "}
              or the default localhost port.
            </span>
          </label>
        </fieldset>

        <fieldset disabled={loading} className="space-y-6">
          <legend className="text-sm font-semibold text-[var(--rr-fg)]">
            Section weights
          </legend>
          <p className="text-xs text-[var(--rr-muted)]">
            Configurable weight per resume section vs. the JD (Lean Canvas:
            section-wise weighted scoring). Values normalize to 100% on save.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {sectionFields.map(({ key, label }) => (
              <label key={key} className="flex flex-col gap-2 text-sm">
                <span className="text-[var(--rr-muted)]">{label}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.sectionWeights[key]}
                  onChange={(e) =>
                    setSectionWeight(key, Number(e.target.value))
                  }
                  className="rounded-xl border border-[var(--rr-border)] bg-[var(--rr-bg)] px-3 py-2.5 text-[var(--rr-fg)]"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset disabled={loading} className="space-y-4">
          <legend className="text-sm font-semibold text-[var(--rr-fg)]">
            Ranker defaults
          </legend>
          <label className="flex max-w-xs flex-col gap-2 text-sm">
            <span className="text-[var(--rr-muted)]">
              Default minimum score filter
            </span>
            <input
              type="number"
              min={0}
              max={100}
              value={draft.defaultMinScore}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  defaultMinScore: Number(e.target.value),
                }))
              }
              className="rounded-xl border border-[var(--rr-border)] bg-[var(--rr-bg)] px-3 py-2.5 text-[var(--rr-fg)]"
            />
          </label>
          <label className="flex items-center gap-3 text-sm text-[var(--rr-fg)]">
            <input
              type="checkbox"
              checked={draft.compactRankCards}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  compactRankCards: e.target.checked,
                }))
              }
              className="h-4 w-4 accent-[var(--rr-accent)]"
            />
            Compact candidate cards
          </label>
          <label className="flex items-center gap-3 text-sm text-[var(--rr-fg)]">
            <input
              type="checkbox"
              checked={draft.showFairnessPanel}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  showFairnessPanel: e.target.checked,
                }))
              }
              className="h-4 w-4 accent-[var(--rr-accent)]"
            />
            Show transparency panel on rank page
          </label>
          <label className="flex items-center gap-3 text-sm text-[var(--rr-fg)]">
            <input
              type="checkbox"
              checked={draft.emailScreeningTips}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  emailScreeningTips: e.target.checked,
                }))
              }
              className="h-4 w-4 accent-[var(--rr-accent)]"
            />
            Screening tips on dashboard
          </label>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--rr-border)] pt-6">
          <button
            type="button"
            disabled={saving || loading}
            onClick={save}
            className="rounded-xl bg-[var(--rr-accent)] px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-[var(--rr-accent)]/20 disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save preferences"}
          </button>
          {msg && (
            <span className="text-sm text-[var(--rr-muted)]">{msg}</span>
          )}
        </div>
      </motion.div>
    </div>
  );
}
