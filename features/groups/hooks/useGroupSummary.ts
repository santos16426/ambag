"use client";

import { useEffect, useMemo, useState } from "react";

import { useGroupSummaryStore } from "../store/group-summary.store";
import type {
  GroupSummaryData,
  GroupSummaryListItem,
  GroupSummaryMember,
} from "../types";

export interface UseGroupSummaryOptions {
  enabled?: boolean;
}

export interface UseGroupSummaryResult {
  loading: boolean;
  error: string | null;
  summary: GroupSummaryData | null;
  totalGroupExpenses: number;
  totalSettlements: number;
  owedByMeTotal: number;
  owedToMeTotal: number;
  netBalance: number;
  isOverallCredit: boolean;
  activeView: "all" | "owed" | "owing";
  setActiveView: (view: "all" | "owed" | "owing") => void;
  items: GroupSummaryListItem[];
  isEmpty: boolean;
  refetch: () => Promise<void>;
}

export function useGroupSummary(
  groupId: string | null,
  options: UseGroupSummaryOptions = {},
): UseGroupSummaryResult {
  const { enabled = true } = options;

  const [activeView, setActiveView] = useState<"all" | "owed" | "owing">("all");

  const summary = useGroupSummaryStore((s) => s.summary);
  const loading = useGroupSummaryStore((s) => s.loading);
  const error = useGroupSummaryStore((s) => s.error);
  const fetchGroupSummary = useGroupSummaryStore((s) => s.fetchGroupSummary);
  const clearGroupSummary = useGroupSummaryStore((s) => s.clearGroupSummary);

  useEffect(() => {
    if (!groupId) {
      const tid = setTimeout(() => clearGroupSummary(), 0);
      return () => clearTimeout(tid);
    }
    if (enabled && groupId) {
      const tid = setTimeout(() => fetchGroupSummary(groupId), 0);
      return () => clearTimeout(tid);
    }
  }, [enabled, groupId, fetchGroupSummary, clearGroupSummary]);

  const totalGroupExpenses = summary?.totalGroupExpenses ?? 0;
  const totalSettlements = summary?.totalSettlements ?? 0;
  const owedByMe = summary?.owedByMe ?? { total: 0, members: [] };
  const owedToMe = summary?.owedToMe ?? { total: 0, members: [] };

  const netBalance = owedToMe.total - owedByMe.total;
  const isOverallCredit = netBalance >= 0;

  const items = useMemo(() => {
    const owing = owedByMe.members.map(
      (m: GroupSummaryMember): GroupSummaryListItem => ({
        ...m,
        side: "owing",
      }),
    );
    const owed = owedToMe.members.map(
      (m: GroupSummaryMember): GroupSummaryListItem => ({
        ...m,
        side: "owed",
      }),
    );
    const combined = [...owing, ...owed];

    if (activeView === "owing") return owing;
    if (activeView === "owed") return owed;
    return combined;
  }, [activeView, owedByMe.members, owedToMe.members]);

  return {
    loading,
    error,
    summary,
    totalGroupExpenses,
    totalSettlements,
    owedByMeTotal: owedByMe.total,
    owedToMeTotal: owedToMe.total,
    netBalance,
    isOverallCredit,
    activeView,
    setActiveView,
    items,
    isEmpty: items.length === 0,
    refetch: () =>
      groupId ? fetchGroupSummary(groupId, { force: true }) : Promise.resolve(),
  };
}
