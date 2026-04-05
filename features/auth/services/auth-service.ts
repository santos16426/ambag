import { createClient } from "@/lib/supabase/client";
import { isAbsoluteHttpUrl } from "@/lib/utils";

import type { AuthMode } from "../schema";
import type { Profile } from "@/types/profile";

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload extends LoginPayload {
  fullName: string;
}

export async function loginWithEmailPassword(payload: LoginPayload) {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signupWithEmailPassword(payload: SignupPayload) {
  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signInWithGoogle(origin: string) {
  const supabase = createClient();

  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/callback`,
    },
  });
}

export async function fetchProfile(
  userId: string,
): Promise<{ data: Profile | null; error: Error | null }> {
  const supabase = createClient();

  // Single uuid arg; parameter name in DB is folded to profileid
  const { data, error } = await supabase.rpc("getprofilebyid", {
    profileid: userId,
  });

  if (error) return { data: null, error: new Error(error.message) };
  // No matching row → null. Some clients return a single composite as object or one-element array.
  if (data == null) return { data: null, error: null };
  const row = Array.isArray(data) ? data[0] : data;
  if (row == null) return { data: null, error: null };
  const profile = row as Profile;

  if (profile.avatarurl && !isAbsoluteHttpUrl(profile.avatarurl)) {
    const { data: publicUrl } = supabase.storage
      .from("avatars")
      .getPublicUrl(profile.avatarurl);
    profile.avatarurl = publicUrl.publicUrl ?? profile.avatarurl;
  }

  return { data: profile, error: null };
}

export function isLoginMode(mode: AuthMode) {
  return mode === "login";
}
