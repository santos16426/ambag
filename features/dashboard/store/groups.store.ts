"use client";

import { create } from "zustand";

import { createClient } from "@/lib/supabase/client";

import type { Group } from "../types";

interface DashboardGroupsState {
  groups: Group[];
  loading: boolean;
  error: string | null;
  activeGroupId: string | null;
  fetchGroups: () => Promise<void>;
  setActiveGroup: (group: Group) => void;
  upsertGroup: (group: Group) => void;
  upsertGroupFromSummary: (summary: RpcGroup) => void;
}

interface RpcGroup {
  id: string;
  name: string;
  description: string | null;
  invitecode: string | null;
  imageurl: string | null;
  createdat: string;
  archivedat: string | null;
  createdbyid: string;
  role: string;
  membercount: number;
  pendingjoinrequestcount: number;
  pendinginvitationcount: number;
  totalexpenses: number;
  totalsettlements: number;
}

function toGroup(summary: RpcGroup): Group {
  return {
    id: summary.id,
    name: summary.name,
    description: summary.description,
    created_by: summary.createdbyid,
    invite_code: summary.invitecode,
    image_url: summary.imageurl ?? null,
    created_at: summary.createdat,
    updated_at: summary.createdat,
    member_count: summary.membercount ?? 0,
    pending_join_requests_count: summary.pendingjoinrequestcount ?? 0,
    pending_invitations_count: summary.pendinginvitationcount ?? 0,
    user_role: (summary.role as "admin" | "member") ?? undefined,
    total_expenses: summary.totalexpenses ?? 0,
    total_settlements: summary.totalsettlements ?? 0,
  };
}

export const useDashboardGroupsStore = create<DashboardGroupsState>()(
  (set, get) => ({
    groups: [],
    loading: false,
    error: null,
    activeGroupId: null,

    setActiveGroup: (group) =>
      set({
        activeGroupId: group.id,
      }),

    upsertGroup: (group) =>
      set((state) => {
        const existingIndex = state.groups.findIndex((g) => g.id === group.id);
        if (existingIndex === -1) {
          return {
            groups: [group, ...state.groups],
            activeGroupId: state.activeGroupId ?? group.id,
          };
        }
        const next = [...state.groups];
        next[existingIndex] = { ...next[existingIndex], ...group };
        return { groups: next };
      }),

    upsertGroupFromSummary: (summary) => {
      const group = toGroup(summary);
      get().upsertGroup(group);
    },

    fetchGroups: async () => {
      if (get().loading) return;
      const supabase = createClient();
      set({ loading: true, error: null });

      const { data, error } = await supabase.rpc("getusergroupssummary");

      if (error) {
        set({
          error: error.message ?? "Failed to load groups",
          loading: false,
        });
        return;
      }

      const payload = (data ?? {}) as { groups?: RpcGroup[] } | null;
      const raw = payload?.groups ?? [];

      const imagePaths = raw
        .map((group) => group.imageurl)
        .filter((path): path is string => !!path);

      let signedUrlByPath: Record<string, string> = {};

      if (imagePaths.length > 0) {
        const { data: signedUrls, error: signedError } = await supabase.storage
          .from("group-images")
          .createSignedUrls(imagePaths, 60 * 60);

        if (signedError) {
          console.error("Failed to create signed URLs for group images", signedError);
        } else if (signedUrls) {
          signedUrlByPath = signedUrls.reduce<Record<string, string>>(
            (acc, item) => {
              if (item.signedUrl && item.path) {
                acc[item.path] = item.signedUrl;
              }
              return acc;
            },
            {},
          );
        }
      }

      const groups: Group[] = raw.map((summary) => {
        const base = toGroup(summary);
        const imagePath = summary.imageurl ?? undefined;

        if (!imagePath) return { ...base, image_url: null };

        const signedUrl = signedUrlByPath[imagePath];

        return {
          ...base,
          image_url: signedUrl ?? null,
        };
      });

      set({
        groups,
        loading: false,
      });
    },
  }),
);

