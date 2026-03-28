"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useUser } from "@/components/providers/AppProviders";
import { AppTopBar } from "@/components/layout/AppTopBar";
import {
  IconHome,
  IconLayers,
  IconSliders,
  IconTag,
} from "@/components/icons/RrIcons";

const nav = [
  { href: "/dashboard", label: "Overview", icon: IconHome },
  { href: "/rank", label: "Rank resumes", icon: IconLayers },
  { href: "/pricing", label: "Pricing", icon: IconTag },
  { href: "/settings", label: "Preferences", icon: IconSliders },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUser();
  const reduce = useReducedMotion();

  async function handleLogout() {
    await logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="rr-app-bg min-h-screen text-[var(--rr-fg)]">
      <div className="flex min-h-screen flex-col">
        <AppTopBar />
        <div className="flex min-h-0 flex-1">
        <motion.aside
          initial={reduce ? false : { x: -12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="sticky top-0 flex h-[calc(100dvh-3.5rem)] w-[260px] shrink-0 flex-col border-r border-[var(--rr-border)] bg-[var(--rr-surface)]/80 px-4 py-6 backdrop-blur-xl"
        >
          <Link href="/dashboard" className="mb-10 flex items-center gap-2 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--rr-accent)] text-sm font-bold text-white shadow-lg shadow-[var(--rr-accent)]/25">
              RR
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Resume Ranker
            </span>
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            {nav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-[var(--rr-accent-muted)] text-[var(--rr-accent)]"
                        : "text-[var(--rr-muted)] hover:bg-[var(--rr-hover)] hover:text-[var(--rr-fg)]"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px] opacity-80" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-[var(--rr-border)] pt-4">
            <div className="mb-3 truncate px-2 text-xs text-[var(--rr-muted)]">
              <p className="font-medium text-[var(--rr-fg)]">{user?.name}</p>
              <p className="truncate">{user?.email}</p>
            </div>
            <Link
              href="/"
              className="mb-2 block rounded-lg px-2 py-2 text-xs text-[var(--rr-muted)] hover:text-[var(--rr-fg)]"
            >
              Marketing site
            </Link>
            <button
              type="button"
              onClick={() => handleLogout()}
              className="w-full rounded-xl border border-[var(--rr-border)] px-3 py-2 text-left text-sm text-[var(--rr-muted)] transition hover:border-[var(--rr-accent)]/40 hover:text-[var(--rr-fg)]"
            >
              Sign out
            </button>
          </div>
        </motion.aside>

        <main className="min-h-[calc(100dvh-3.5rem)] min-w-0 flex-1 overflow-y-auto p-6 sm:p-8 lg:p-10">
          <motion.div
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-5xl"
          >
            {children}
          </motion.div>
        </main>
        </div>
      </div>
    </div>
  );
}
