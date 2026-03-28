"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import {
  IconBriefcase,
  IconLayoutDashboard,
  IconLayers,
  IconTag,
} from "@/components/icons/RrIcons";

const cols = [
  {
    title: "Product",
    icon: IconTag,
    links: [
      { href: "/", label: "Overview" },
      { href: "/pricing", label: "Pricing" },
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create account" },
    ],
  },
  {
    title: "Workspace",
    icon: IconLayoutDashboard,
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/rank", label: "Rank resumes" },
      { href: "/settings", label: "Preferences" },
    ],
  },
  {
    title: "Project",
    icon: IconLayers,
    links: [
      { href: "/", label: "Product overview" },
      { href: "/pricing", label: "Plans & limits" },
    ],
  },
];

export function SiteFooter({ className }: { className?: string }) {
  const reduce = useReducedMotion();

  return (
    <motion.footer
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "border-t border-[var(--rr-border)] bg-[var(--rr-surface)]/40 backdrop-blur-sm",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--rr-accent)] to-indigo-600 text-xs font-bold text-white shadow-md shadow-[var(--rr-accent)]/35">
                RR
                <IconBriefcase
                  className="pointer-events-none absolute -right-1 -bottom-1 h-5 w-5 text-white/25"
                  aria-hidden
                />
              </span>
              <span className="text-sm font-semibold">Resume Ranker</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[var(--rr-muted)]">
              Transparent, section-wise resume screening—built for recruiters
              who care about fit, not keyword noise.
            </p>
          </div>
          {cols.map((col) => {
            const ColIcon = col.icon;
            return (
            <div key={col.title}>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--rr-muted)]">
                <ColIcon className="h-3.5 w-3.5 text-[var(--rr-accent)]" aria-hidden />
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-[var(--rr-fg)]/80 transition hover:text-[var(--rr-accent)]"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            );
          })}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--rr-border)] pt-8 text-center text-xs text-[var(--rr-muted)] sm:flex-row sm:text-left">
          <p>© {new Date().getFullYear()} Resume Ranker · Course project</p>
          <p className="max-w-md sm:text-right">
            Payments & compliance flows are placeholders—wire your gateway when
            you go live.
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
