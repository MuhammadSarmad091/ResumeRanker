import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <PublicPageLayout appBarVariant="compact">
      <SignupForm />
    </PublicPageLayout>
  );
}
