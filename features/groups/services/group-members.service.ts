import { createClient } from "@/lib/supabase/client";

import type { MemberInvite } from "@/components/common/MemberSearch";

export async function removeGroupMember(
  memberId: string,
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.rpc("deletegroupmember", {
    memberid: memberId,
  });
  return { error: error ?? null };
}

export async function cancelGroupInvitation(
  invitationId: string,
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.rpc("deletegroupinvite", {
    groupinviteid: invitationId,
  });
  return { error: error ?? null };
}

export async function addMembersToGroup(
  groupId: string,
  members: MemberInvite[],
): Promise<{ error: Error | null }> {
  const response = await fetch("/api/groups/members/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      groupId,
      members: members.map((member) => ({
        id: member.id,
        email: member.email,
        isExistingUser: member.isExistingUser,
      })),
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    return { error: new Error(body?.error ?? "Failed to add members") };
  }

  return { error: null };
}
