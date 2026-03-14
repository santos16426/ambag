"use client";

import { create } from "zustand";

import { GROUP_IMAGES_BUCKET } from "@/constants/storage";
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
    createdby: summary.createdbyid,
    invitecode: summary.invitecode,
    imageurl: summary.imageurl ?? null,
    createdat: summary.createdat,
    updatedat: summary.createdat,
    membercount: summary.membercount ?? 0,
    pendingjoinrequestcount: summary.pendingjoinrequestcount ?? 0,
    pendinginvitationcount: summary.pendinginvitationcount ?? 0,
    userrole: (summary.role as "admin" | "member") ?? undefined,
    totalexpenses: summary.totalexpenses ?? 0,
    totalsettlements: summary.totalsettlements ?? 0,
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
          .from(GROUP_IMAGES_BUCKET)
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

        if (!imagePath) return { ...base, imageurl: null };

        const signedUrl = signedUrlByPath[imagePath];

        return {
          ...base,
          imageurl: signedUrl ?? null,
        };
      });

      set({
        groups,
        loading: false,
      });
    },
  }),
);

