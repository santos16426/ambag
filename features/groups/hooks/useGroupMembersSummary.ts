"use client";

import { useCallback, useEffect } from "react";

import { useGroupsStore, getMembersState } from "../store/groups.store";
import type { GroupMembersSummary } from "../types";

const DEFAULT_STATE = {
  summary: null as GroupMembersSummary | null,
  loading: false,
  error: null as string | null,
};

export interface UseGroupMembersSummaryResult {
  summary: GroupMembersSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useGroupMembersSummary(
  groupId: string | null,
): UseGroupMembersSummaryResult {
  const state = useGroupsStore((s) =>
    groupId ? s.membersByGroupId[groupId] ?? DEFAULT_STATE : DEFAULT_STATE,
  );
  const fetchMembersSummary = useGroupsStore((s) => s.fetchMembersSummary);

  const refetch = useCallback(async () => {
    if (groupId) {
      await fetchMembersSummary(groupId);
    }
  }, [groupId, fetchMembersSummary]);

  useEffect(() => {
    if (!groupId) return;
    const current = getMembersState(groupId);
    if (!current?.summary && !current?.loading) {
      void fetchMembersSummary(groupId);
    }
  }, [groupId, fetchMembersSummary]);

  return {
    summary: state.summary,
    loading: state.loading,
    error: state.error,
    refetch,
  };
}

