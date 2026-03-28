"use client";

import { MarketingAppBar } from "@/components/layout/MarketingAppBar";
import { SiteFooter } from "@/components/layout/SiteFooter";

export function PublicPageLayout({
  children,
  appBarVariant = "default",
}: {
  children: React.ReactNode;
  appBarVariant?: "default" | "compact";
}) {
  return (
    <div className="rr-app-bg flex min-h-screen flex-col text-[var(--rr-fg)]">
      <MarketingAppBar variant={appBarVariant} />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter className="mt-auto" />
    </div>
  );
}
