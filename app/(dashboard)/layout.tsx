"use client";

import Sidebar from "@/components/common/Sidebar";
import Header from "@/components/common/Header";
import { AuthSync } from "@/features/auth/components/AuthSync";
import AppShell from "@/components/common/AppShell";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <AuthSync />
      <AppShell>
        <Toaster />
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <Header />
          <main className="flex-1 flex overflow-hidden relative">
            <div className="h-full flex-1 bg-background no-scrollbar overflow-y-auto">
              {children}
            </div>
          </main>
        </div>
      </AppShell>
    </div>
  );
}
