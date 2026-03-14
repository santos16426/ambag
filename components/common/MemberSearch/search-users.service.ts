import { createClient } from "@/lib/supabase/client";

import type { MemberInvite } from "./types";

export async function searchUserByEmail(
  email: string,
): Promise<MemberInvite | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("searchusersbyemail", {
    emailquery: email,
  });

  if (error) return null;

  const payload = (data ?? null) as {
    users?: Array<{
      id: string;
      email: string;
      fullname: string | null;
      avatarurl: string | null;
    }>;
  } | null;

  const users = payload?.users ?? [];
  const exact = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase(),
  );

  if (exact) {
    return {
      id: exact.id,
      email: exact.email,
      full_name: exact.fullname,
      avatar_url: exact.avatarurl,
      isExistingUser: true,
    };
  }

  return {
    id: `invite-${Date.now()}`,
    email,
    full_name: null,
    avatar_url: null,
    isExistingUser: false,
  };
}
