"use server";

import { createClient } from "@/lib/supabase/server";

export type RemoveMemberResult = {
  data: { success: boolean } | null;
  error: { message: string } | null;
};

export async function removeGroupMemberAction(
  groupId: string,
  memberId: string,
): Promise<RemoveMemberResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("groupmembers")
    .update({ status: "removed", removedat: new Date().toISOString() })
    .eq("id", memberId)
    .eq("groupid", groupId);

  if (error) {
    return {
      data: null,
      error: { message: error.message ?? "Failed to remove member" },
    };
  }

  return { data: { success: true }, error: null };
}

