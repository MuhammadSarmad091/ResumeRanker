import { Suspense } from "react";
import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <PublicPageLayout appBarVariant="compact">
      <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-24 text-sm text-[var(--rr-muted)]">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </PublicPageLayout>
  );
}
