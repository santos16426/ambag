"use server";

import { createClient } from "@/lib/supabase/server";
import type { MemberInvite } from "@/features/dashboard/components/MemberSearch";

export type AddMembersToGroupResult = {
  data: boolean | null;
  error: { message: string } | null;
};

export async function addMembersToGroupAction(
  groupId: string,
  members: MemberInvite[],
): Promise<AddMembersToGroupResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      data: null,
      error: { message: "You must be logged in to add members" },
    };
  }

  if (!groupId?.trim()) {
    return { data: null, error: { message: "Group is required" } };
  }

  if (!members.length) {
    return { data: null, error: { message: "No members to add" } };
  }

  const existingMembers = members.filter((m) => m.isExistingUser);
  const nonExistingMembers = members.filter((m) => !m.isExistingUser);

  if (existingMembers.length > 0) {
    const rows = existingMembers.map((m) => ({
      groupid: groupId,
      userid: m.id,
      role: "member" as const,
      status: "active" as const,
      joinedat: new Date().toISOString(),
    }));

    const { error } = await supabase.from("groupmembers").insert(rows);

    if (error) {
      return {
        data: null,
        error: {
          message: error.message ?? "Failed to add members",
        },
      };
    }
  }

  if (nonExistingMembers.length > 0) {
    const inviteRows = nonExistingMembers.map((m) => ({
      groupid: groupId,
      invitedemail: m.email.toLowerCase().trim(),
      invitedby: user.id,
      role: "member" as const,
      status: "pending" as const,
      invitetoken: null,
    }));

    const { error } = await supabase.from("groupinvites").insert(inviteRows);

    if (error) {
      return {
        data: null,
        error: {
          message: error.message ?? "Failed to send invitations",
        },
      };
    }
  }

  return { data: true, error: null };
}

