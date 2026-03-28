"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useUser } from "@/components/providers/AppProviders";
import {
  IconArrowRight,
  IconLock,
  IconLogIn,
  IconMail,
} from "@/components/icons/RrIcons";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const { user, loading: userLoading, refreshUser } = useUser();
  const reduce = useReducedMotion();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userLoading && user) {
      router.replace(next);
    }
  }, [user, userLoading, router, next]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = (await r.json()) as { error?: string };
      if (!r.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      await refreshUser();
      router.replace(next);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (userLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-[var(--rr-muted)]">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:py-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[400px]"
      >
        <div className="rr-card p-8 shadow-xl shadow-black/5">
          <div className="flex gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--rr-accent)]/12 text-[var(--rr-accent)] ring-1 ring-[var(--rr-accent)]/20">
              <IconLogIn className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--rr-fg)]">
                Sign in
              </h1>
              <p className="mt-2 text-sm text-[var(--rr-muted)]">
                Access your screening workspace.
              </p>
            </div>
          </div>
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <label className="block text-sm">
              <span className="text-[var(--rr-muted)]">Email</span>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--rr-muted)]">
                  <IconMail className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-[var(--rr-border)] bg-[var(--rr-bg)] py-2.5 pl-10 pr-3 text-[var(--rr-fg)] outline-none focus:border-[var(--rr-accent)]/50"
                />
              </div>
            </label>
            <label className="block text-sm">
              <span className="text-[var(--rr-muted)]">Password</span>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--rr-muted)]">
                  <IconLock className="h-[18px] w-[18px]" aria-hidden />
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[var(--rr-border)] bg-[var(--rr-bg)] py-2.5 pl-10 pr-3 text-[var(--rr-fg)] outline-none focus:border-[var(--rr-accent)]/50"
                />
              </div>
            </label>
            {error && (
              <p className="text-sm text-rose-600 dark:text-rose-400">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--rr-accent)] py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--rr-accent)]/25 disabled:opacity-40"
            >
              {submitting ? "Signing in…" : "Sign in"}
              {!submitting && (
                <IconArrowRight className="h-4 w-4 opacity-90" aria-hidden />
              )}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-[var(--rr-muted)]">
            No account?{" "}
            <Link
              href="/signup"
              className="font-medium text-[var(--rr-accent)] hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
