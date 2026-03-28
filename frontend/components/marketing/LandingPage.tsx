"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { HeroCursorLeak } from "@/components/ui/HeroCursorLeak";
import {
  IconArrowRight,
  IconBriefcase,
  IconColumns2,
  IconLayoutDashboard,
  IconSliders,
  IconSparkles,
  IconTarget,
} from "@/components/icons/RrIcons";
import type { ComponentType } from "react";

const features: {
  title: string;
  body: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  {
    title: "Semantic fit, not keyword bingo",
    body: "Structured JD and resume fields help you judge alignment to intent—not just ATS keyword density.",
    icon: IconTarget,
  },
  {
    title: "Rank, shortlist, compare",
    body: "Fit scores, starred shortlists, reviewer notes, and a two-up compare view for close calls.",
    icon: IconColumns2,
  },
  {
    title: "Transparent scoring",
    body: "Adjust how much skill coverage vs. responsibility overlap matters, and see it spelled out on the page.",
    icon: IconSliders,
  },
  {
    title: "Your workspace",
    body: "Sign in to sync saved preferences; screening history and notes stay in your browser per account.",
    icon: IconLayoutDashboard,
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function LandingPage() {
  const reduce = useReducedMotion();
  const variants = reduce ? {} : container;
  const itemVariants = reduce ? {} : item;

  return (
    <main className="mx-auto max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-10">
      <HeroCursorLeak className="rr-hero-mesh rounded-3xl border border-[var(--rr-border)] bg-[var(--rr-surface)] px-6 py-16 sm:px-12 sm:py-20">
        <div className="pointer-events-none absolute -right-20 -top-20 z-[1] h-64 w-64 rounded-full bg-[var(--rr-accent)]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 z-[1] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl dark:bg-cyan-400/5" />
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-2xl"
        >
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--rr-accent)]">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--rr-accent)]/12 text-[var(--rr-accent)] ring-1 ring-[var(--rr-accent)]/20">
              <IconBriefcase className="h-4 w-4" aria-hidden />
            </span>
            Early-stage hiring
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.1]">
            Fairer, faster resume screening against the real job.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[var(--rr-muted)]">
            Manual and keyword-only screening wastes time, hides strong
            candidates, and invites bias. Resume Ranker helps recruiters and
            hiring managers see relevance clearly—so you shortlist with
            confidence.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--rr-accent)] px-6 py-3 text-sm font-medium text-white shadow-xl shadow-[var(--rr-accent)]/25 transition hover:opacity-95"
            >
              Create free account
              <IconSparkles className="h-4 w-4 opacity-90" aria-hidden />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--rr-border)] px-6 py-3 text-sm font-medium text-[var(--rr-fg)] transition hover:bg-[var(--rr-hover)]"
            >
              Sign in
              <IconArrowRight className="h-4 w-4 opacity-70" aria-hidden />
            </Link>
          </div>
        </motion.div>
      </HeroCursorLeak>

      <motion.section
        variants={variants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        className="mt-20 grid gap-5 sm:grid-cols-2"
      >
        {features.map((f) => {
          const FeatureIcon = f.icon;
          return (
          <motion.article
            key={f.title}
            variants={itemVariants}
            className="rr-card group p-6 transition hover:border-[var(--rr-accent)]/30"
          >
            <div className="mb-4 flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--rr-accent)]/10 text-[var(--rr-accent)] ring-1 ring-[var(--rr-accent)]/15 transition group-hover:bg-[var(--rr-accent)]/15 group-hover:ring-[var(--rr-accent)]/25">
                <FeatureIcon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-2 h-1 w-10 rounded-full bg-[var(--rr-accent)]/80 transition group-hover:w-14" />
                <h2 className="text-lg font-semibold text-[var(--rr-fg)]">
                  {f.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--rr-muted)]">
                  {f.body}
                </p>
              </div>
            </div>
          </motion.article>
          );
        })}
      </motion.section>
    </main>
  );
}
