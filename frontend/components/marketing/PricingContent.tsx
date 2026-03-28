"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { PLANS } from "@/lib/plans";
import { cn } from "@/lib/cn";
import {
  IconBuilding,
  IconCheckCircle,
  IconExternalLink,
  IconTag,
  IconTrendingUp,
  IconZap,
} from "@/components/icons/RrIcons";
import type { ComponentType } from "react";

const planIcons: Record<string, ComponentType<{ className?: string }>> = {
  basic: IconZap,
  growth: IconTrendingUp,
  enterprise: IconBuilding,
};

export function PricingContent() {
  const reduce = useReducedMotion();

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl text-center"
      >
        <p className="inline-flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--rr-accent)]">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--rr-accent)]/12 text-[var(--rr-accent)] ring-1 ring-[var(--rr-accent)]/20">
            <IconTag className="h-4 w-4" aria-hidden />
          </span>
          Subscription
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Volume-based tiers for every hiring motion
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--rr-muted)] sm:text-base">
          Aligns with our Lean Canvas: Basic for lean teams, Growth for agencies
          and scale-ups, Enterprise for high volume and advanced analytics.
          Payment gateway integration can plug in later—here you pick a plan and
          track usage in-app.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan, i) => {
          const PlanIcon = planIcons[plan.id] ?? IconTag;
          return (
          <motion.article
            key={plan.id}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={cn(
              "rr-card relative flex flex-col p-6 sm:p-8",
              plan.id === "growth" &&
                "border-[var(--rr-accent)]/40 shadow-lg shadow-[var(--rr-accent)]/10 ring-1 ring-[var(--rr-accent)]/20"
            )}
          >
            {plan.id === "growth" && (
              <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[var(--rr-accent)] px-3 py-0.5 text-xs font-medium text-white shadow-md shadow-[var(--rr-accent)]/30">
                <IconTrendingUp className="h-3 w-3 opacity-90" aria-hidden />
                Popular
              </span>
            )}
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1",
                  plan.id === "growth"
                    ? "bg-[var(--rr-accent)]/15 text-[var(--rr-accent)] ring-[var(--rr-accent)]/25"
                    : "bg-[var(--rr-hover)] text-[var(--rr-muted)] ring-[var(--rr-border)]"
                )}
              >
                <PlanIcon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <p className="mt-1 text-sm text-[var(--rr-muted)]">
                  {plan.tagline}
                </p>
              </div>
            </div>
            <p className="mt-6 flex items-baseline gap-1">
              <span className="text-3xl font-semibold tracking-tight">
                {plan.priceMonthly}
              </span>
              {plan.priceMonthly !== "Custom" && (
                <span className="text-sm text-[var(--rr-muted)]">/mo</span>
              )}
            </p>
            <p className="mt-2 text-xs text-[var(--rr-muted)]">
              {plan.resumeLimitPerMonth === null
                ? "Unlimited analyses (fair use)"
                : `Up to ${plan.resumeLimitPerMonth.toLocaleString()} resume analyses / month`}
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm text-[var(--rr-muted)]">
              {plan.highlights.map((h) => (
                <li key={h} className="flex gap-2.5">
                  <IconCheckCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--rr-accent)]"
                    aria-hidden
                  />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            <Link
              href={
                plan.id === "enterprise"
                  ? "mailto:sales@resumeranker.example?subject=Enterprise%20plan"
                  : `/signup?tier=${plan.id}`
              }
              className={cn(
                "mt-8 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-center text-sm font-medium transition",
                plan.id === "growth"
                  ? "bg-[var(--rr-accent)] text-white shadow-md shadow-[var(--rr-accent)]/25 hover:opacity-95"
                  : "border border-[var(--rr-border)] text-[var(--rr-fg)] hover:bg-[var(--rr-hover)]"
              )}
            >
              {plan.cta}
              {plan.id === "enterprise" && (
                <IconExternalLink className="h-4 w-4 opacity-80" aria-hidden />
              )}
            </Link>
          </motion.article>
          );
        })}
      </div>

      <p className="mx-auto mt-12 max-w-xl text-center text-xs text-[var(--rr-muted)]">
        Optional add-on: advanced analytics (usage cohorts, funnel views) is
        available on Growth+ and configurable in Preferences after signup.
      </p>
    </main>
  );
}
