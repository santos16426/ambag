import { Suspense } from "react";

import { AuthPage } from "@/features/auth/components/AuthPage";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPage />
    </Suspense>
  );
}

