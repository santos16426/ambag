import type { User } from "@supabase/supabase-js";

/** Supabase auth user — session identity only; app display uses Profile. */
export type AuthSessionUser = User;

export interface AuthError {
  message: string;
  field?: string;
  status?: number;
}
