"use client";

import { create } from "zustand";

import { createClient } from "@/lib/supabase/client";
import type { AuthSessionUser } from "@/types/auth";
import type { Profile } from "@/types/profile";

import type { AuthMode } from "../schema";
import { fetchProfile } from "../services/auth-service";

interface AuthState {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  sessionUser: AuthSessionUser | null;
  profile: Profile | null;
  initialized: boolean;
  isLoading: boolean;
  setSessionUser: (user: AuthSessionUser | null) => void;
  setProfile: (profile: Profile | null) => void;
  logout: () => Promise<void>;
  initFromSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  mode: "login",
  setMode: (mode) => set({ mode }),
  sessionUser: null,
  profile: null,
  initialized: false,
  isLoading: false,
  setSessionUser: (user) => set({ sessionUser: user }),
  setProfile: (profile) => set({ profile }),
  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({
      profile: null,
      sessionUser: null,
      initialized: true,
    });
  },
  refreshProfile: async () => {
    if (get().isLoading) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return;
    // If we already have a profile for the current user, skip redundant refreshes.
    if (get().sessionUser?.id === user.id && get().profile) return;
    const { data } = await fetchProfile(user.id);
    if (data) set({ profile: data });
  },
  initFromSession: async () => {
    if (get().initialized || get().isLoading) return;
    set({ isLoading: true });
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      set({
        profile: null,
        sessionUser: null,
        initialized: true,
        isLoading: false,
      });
      return;
    }
    set({ sessionUser: user });
    const { data: profile } = await fetchProfile(user.id);
    set({
      profile,
      initialized: true,
      isLoading: false,
    });
  },
}));
