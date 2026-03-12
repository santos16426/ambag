"use client";

import { useAuthStore } from "@/features/auth/store/auth.store";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const initialized = useAuthStore((s) => s.initialized);
  const profile = useAuthStore((s) => s.profile);
  if (!initialized || !profile) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return <>{children}</>;
}
