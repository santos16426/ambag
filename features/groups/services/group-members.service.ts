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
  const supabase = createClient();

  for (const member of members) {
    if (member.isExistingUser) {
      const { error } = await supabase.rpc("creategroupmember", {
        payload: {
          groupid: groupId,
          userid: member.id,
          role: "member",
          status: "active",
        },
      });
      if (error) return { error };
    } else {
      const { error } = await supabase.rpc("creategroupinvite", {
        payload: {
          groupId,
          invitedEmail: member.email,
          inviteToken: crypto.randomUUID(),
        },
      });
      if (error) return { error };
    }
  }

  return { error: null };
}
