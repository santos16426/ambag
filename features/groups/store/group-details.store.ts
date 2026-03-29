"use client";

import { create } from "zustand";

import type { Group } from "@/features/dashboard/types";

import type { GroupDetailMember } from "../types";
import { getGroupDetails } from "../services/group-details.service";

interface GroupDetailsState {
  group: Group | null;
  members: GroupDetailMember[];
  loading: boolean;
  error: string | null;
  groupId: string | null;
  fetchGroupDetails: (
    groupId: string,
    options?: { force?: boolean },
  ) => Promise<void>;
  setGroupImageUrl: (
    groupId: string,
    imageUrl: string | null,
    imagePath?: string | null,
  ) => void;
  setGroupDetails: (
    groupId: string,
    patch: {
      name?: string;
      description?: string | null;
      archivedat?: string | null;
    },
  ) => void;
  clearGroupDetails: () => void;
}

export const useGroupDetailsStore = create<GroupDetailsState>()((set, get) => ({
  group: null,
  members: [],
  loading: false,
  error: null,
  groupId: null,

  fetchGroupDetails: async (groupId: string, options?: { force?: boolean }) => {
    if (!groupId) return;

    const state = get();
    if (state.loading && state.groupId === groupId) return;
    if (
      !options?.force &&
      state.groupId === groupId &&
      state.group != null
    ) {
      return;
    }

    set({ loading: true, error: null, groupId });

    const { data, error } = await getGroupDetails(groupId);

    if (get().groupId !== groupId) return;

    if (error) {
      set({
        loading: false,
        error: error.message ?? "Failed to load group details",
        group: null,
        members: [],
      });
      return;
    }

    set({
      loading: false,
      error: null,
      group: data?.group ?? null,
      members: data?.members ?? [],
    });
  },

  setGroupImageUrl: (
    groupId: string,
    imageUrl: string | null,
    imagePath?: string | null,
  ) =>
    set((state) =>
      state.group?.id === groupId
        ? {
            group: {
              ...state.group,
              imageurl: imageUrl,
              imagepath:
                imageUrl === null ? null : (imagePath ?? state.group?.imagepath ?? null),
            },
          }
        : state,
    ),

  setGroupDetails: (groupId: string, patch) =>
    set((state) =>
      state.group?.id === groupId
        ? {
            group: {
              ...state.group,
              ...(patch.name !== undefined && { name: patch.name }),
              ...(patch.description !== undefined && {
                description: patch.description,
              }),
              ...(patch.archivedat !== undefined && {
                archivedat: patch.archivedat,
              }),
            },
          }
        : state,
    ),

  clearGroupDetails: () =>
    set({
      group: null,
      members: [],
      error: null,
      groupId: null,
    }),
}));
