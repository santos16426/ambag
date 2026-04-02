import type { Metadata } from "next";
import type { ReactNode } from "react";

export async function generateMetadata(): Promise<Metadata> {
  return {
    manifest: `/manifest.webmanifest?start=${encodeURIComponent("/settings")}`,
  };
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
