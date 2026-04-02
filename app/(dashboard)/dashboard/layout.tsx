import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    manifest: `/manifest.webmanifest?start=${encodeURIComponent("/dashboard")}`,
  };
}

export default function DashboardRoutesLayout({ children }: { children: ReactNode }) {
  return children;
}
