import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getGroupNameForPwaManifest } from "@/features/groups/services/group-pwa.server";

interface DashboardGroupLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: DashboardGroupLayoutProps): Promise<Metadata> {
  const { id } = await params;
  const startPath = `/dashboard/${id}`;
  const groupName = await getGroupNameForPwaManifest(id);

  const q = new URLSearchParams();
  q.set("start", startPath);
  if (groupName) q.set("name", groupName);

  return {
    manifest: `/manifest.webmanifest?${q.toString()}`,
  };
}

export default function DashboardGroupLayout({ children }: DashboardGroupLayoutProps) {
  return children;
}
