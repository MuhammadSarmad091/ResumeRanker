"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { IconHome, IconZap } from "@/components/icons/RrIcons";

const titles: Record<string, string> = {
  "/dashboard": "Overview",
  "/rank": "Rank resumes",
  "/settings": "Preferences",
  "/pricing": "Pricing",
};

export function AppTopBar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const title =
    titles[pathname] ??
    (pathname.startsWith("/rank")
      ? "Rank resumes"
      : pathname.startsWith("/settings")
        ? "Preferences"
        : "Workspace");

  return (
    <motion.header
      initial={reduce ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[var(--rr-border)] bg-[var(--rr-surface)]/80 px-4 backdrop-blur-xl sm:px-6"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--rr-accent)]/10 text-[var(--rr-accent)] ring-1 ring-[var(--rr-accent)]/15 sm:flex">
          <IconZap className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--rr-muted)]">
          Workspace
        </p>
        <h1 className="truncate text-base font-semibold tracking-tight text-[var(--rr-fg)]">
          {title}
        </h1>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href="/rank"
          className={cn(
            "hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition sm:inline-flex",
            pathname === "/rank" || pathname.startsWith("/rank/")
              ? "bg-[var(--rr-accent-muted)] text-[var(--rr-accent)]"
              : "text-[var(--rr-muted)] hover:bg-[var(--rr-hover)] hover:text-[var(--rr-fg)]"
          )}
        >
          <IconZap className="h-4 w-4 opacity-80" aria-hidden />
          Run screening
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--rr-border)] px-3 py-2 text-sm font-medium text-[var(--rr-muted)] transition hover:border-[var(--rr-accent)]/30 hover:text-[var(--rr-fg)]"
        >
          <IconHome className="h-4 w-4 opacity-70" aria-hidden />
          Home
        </Link>
      </div>
    </motion.header>
  );
}
