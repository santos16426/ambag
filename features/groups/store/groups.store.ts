"use client";

import { create } from "zustand";

import type { GroupMembersSummary } from "../types";
import { getGroupMembersSummary } from "../services/groups-client.service";

interface MembersSummaryState {
  summary: GroupMembersSummary | null;
  loading: boolean;
  error: string | null;
}

interface GroupsState {
  membersByGroupId: Record<string, MembersSummaryState>;
  fetchMembersSummary: (groupId: string) => Promise<void>;
}

const DEFAULT_MEMBERS_STATE: MembersSummaryState = {
  summary: null,
  loading: false,
  error: null,
};

export const useGroupsStore = create<GroupsState>()((set, get) => ({
  membersByGroupId: {},

  fetchMembersSummary: async (groupId: string) => {
    if (!groupId) return;

    set((state) => ({
      membersByGroupId: {
        ...state.membersByGroupId,
        [groupId]: {
          ...(state.membersByGroupId[groupId] ?? DEFAULT_MEMBERS_STATE),
          loading: true,
          error: null,
        },
      },
    }));

    const { data, error } = await getGroupMembersSummary(groupId);

    set((state) => ({
      membersByGroupId: {
        ...state.membersByGroupId,
        [groupId]: {
          summary: data ?? null,
          loading: false,
          error: error?.message ?? null,
        },
      },
    }));
  },
}));

export function getMembersState(
  groupId: string | null,
): MembersSummaryState | null {
  if (!groupId) return null;
  const state = useGroupsStore.getState().membersByGroupId[groupId];
  return state ?? DEFAULT_MEMBERS_STATE;
}

