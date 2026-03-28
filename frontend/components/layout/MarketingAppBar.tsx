"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import {
  IconHome,
  IconLogIn,
  IconTag,
  IconUserPlus,
} from "@/components/icons/RrIcons";

type Props = {
  /** Slightly denser bar on auth pages */
  variant?: "default" | "compact";
};

const links = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/pricing", label: "Pricing", icon: IconTag },
  { href: "/login", label: "Sign in", icon: IconLogIn },
] as const;

export function MarketingAppBar({ variant = "default" }: Props) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  return (
    <motion.header
      initial={reduce ? false : { y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "sticky top-0 z-50 border-b border-[var(--rr-border)]/80 bg-[var(--rr-surface)]/75 backdrop-blur-xl backdrop-saturate-150",
        variant === "compact" ? "py-3" : "py-4"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-xl outline-none ring-[var(--rr-accent)]/40 focus-visible:ring-2"
        >
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--rr-accent)] to-indigo-600 text-sm font-bold text-white shadow-lg shadow-[var(--rr-accent)]/35 transition group-hover:shadow-xl group-hover:shadow-[var(--rr-accent)]/40">
            <span className="relative z-10">RR</span>
            <span className="absolute inset-0 bg-white/20 opacity-0 transition group-hover:opacity-100" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight text-[var(--rr-fg)]">
              Resume Ranker
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-[var(--rr-muted)]">
              AI screening
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map(({ href, label, icon: NavIcon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors sm:px-4",
                  active
                    ? "bg-[var(--rr-accent-muted)] text-[var(--rr-accent)]"
                    : "text-[var(--rr-muted)] hover:bg-[var(--rr-hover)] hover:text-[var(--rr-fg)]"
                )}
              >
                <NavIcon
                  className="hidden h-[17px] w-[17px] shrink-0 opacity-80 sm:block"
                  aria-hidden
                />
                {label}
              </Link>
            );
          })}
          <Link
            href="/signup"
            className="ml-1 inline-flex items-center gap-2 rounded-xl bg-[var(--rr-accent)] px-4 py-2 text-sm font-medium text-white shadow-md shadow-[var(--rr-accent)]/30 transition hover:opacity-95 sm:ml-2"
          >
            <IconUserPlus className="hidden h-[17px] w-[17px] sm:block" aria-hidden />
            Get started
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
