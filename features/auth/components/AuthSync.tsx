"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

import { useAuthStore } from "../store/auth.store";

export function AuthSync() {
  const setSessionUser = useAuthStore((s) => s.setSessionUser);
  const initFromSession = useAuthStore((s) => s.initFromSession);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  useEffect(() => {
    initFromSession();
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSessionUser(session?.user ?? null);
      // Avoid double-fetch in dev: INITIAL_SESSION fires immediately and initFromSession already loads profile.
      if (event !== "INITIAL_SESSION" && session?.user) refreshProfile();
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [initFromSession, setSessionUser, refreshProfile]);

  return null;
}
