"use client";

import { useEffect, useMemo, useState } from "react";

import { getGroupSummary } from "@/features/groups/services/group-summary.service";

import type { Group } from "../types";

export interface DashboardGroupSummaryItem {
  id: string;
  groupname: string;
  topay: number;
  tocollect: number;
}

export interface DashboardFinancialSummary {
  totalnetworth: number;
  totaltocollect: number;
  totaltopay: number;
  groupsummary: DashboardGroupSummaryItem[];
}

const EMPTY_SUMMARY: DashboardFinancialSummary = {
  totalnetworth: 0,
  totaltocollect: 0,
  totaltopay: 0,
  groupsummary: [],
};

export function useDashboardFinancialSummary(groups: Group[]) {
  const [groupsummary, setGroupSummary] = useState<DashboardGroupSummaryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSummaries() {
      if (groups.length === 0) {
        if (!isMounted) return;
        setGroupSummary([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const summaries = await Promise.all(
        groups.map(async (group) => {
          const { data } = await getGroupSummary(group.id);
          return {
            id: group.id,
            groupname: group.name,
            topay: data?.owedByMe.total ?? 0,
            tocollect: data?.owedToMe.total ?? 0,
          };
        }),
      );

      if (!isMounted) return;
      setGroupSummary(summaries);
      setLoading(false);
    }

    void loadSummaries();

    return () => {
      isMounted = false;
    };
  }, [groups]);

  const summary = useMemo<DashboardFinancialSummary>(() => {
    if (groupsummary.length === 0) return EMPTY_SUMMARY;

    const totaltocollect = groupsummary.reduce((sum, group) => sum + group.tocollect, 0);
    const totaltopay = groupsummary.reduce((sum, group) => sum + group.topay, 0);

    return {
      totalnetworth: totaltocollect - totaltopay,
      totaltocollect,
      totaltopay,
      groupsummary,
    };
  }, [groupsummary]);

  return { summary, loading };
}

