"use client";

import { create } from "zustand";

import { getGroupSummary } from "../services/group-summary.service";
import type { GroupSummaryData } from "../types";

interface GroupSummaryState {
  groupId: string | null;
  summary: GroupSummaryData | null;
  loading: boolean;
  error: string | null;
  fetchGroupSummary: (groupId: string, options?: { force?: boolean }) => Promise<void>;
  clearGroupSummary: () => void;
}

export const useGroupSummaryStore = create<GroupSummaryState>()((set, get) => ({
  groupId: null,
  summary: null,
  loading: false,
  error: null,

  fetchGroupSummary: async (groupId: string, options?: { force?: boolean }) => {
    if (!groupId) return;

    const state = get();
    if (state.loading && state.groupId === groupId) return;
    if (!options?.force && state.groupId === groupId && state.summary != null) return;

    set({ loading: true, error: null, groupId });

    const { data, error } = await getGroupSummary(groupId);

    if (get().groupId !== groupId) return;

    if (error) {
      set({ loading: false, error: error.message ?? "Failed to load group summary", summary: null });
      return;
    }

    set({ loading: false, error: null, summary: data });
  },

  clearGroupSummary: () =>
    set({ groupId: null, summary: null, error: null, loading: false }),
}));
