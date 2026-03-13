"use server";

import { createClient } from "@/lib/supabase/server";

export type CancelInvitationResult = {
  data: { success: boolean } | null;
  error: { message: string } | null;
};

export async function cancelGroupInvitationAction(
  invitationId: string,
): Promise<CancelInvitationResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: { message: "You must be logged in" } };
  }

  const { data: invitation, error: invitationError } = await supabase
    .from("groupinvites")
    .select("id, groupid")
    .eq("id", invitationId)
    .single();

  if (invitationError || !invitation) {
    return { data: null, error: { message: "Invitation not found" } };
  }

  const { data: group } = await supabase
    .from("groups")
    .select("id, createdby")
    .eq("id", invitation.groupid)
    .single();

  if (!group) {
    return { data: null, error: { message: "Group not found" } };
  }

  const isOwner = group.createdby === user.id;

  const { data: membersSummary } = await supabase
    .from("groupmembers")
    .select("role, user:profiles!groupmembers_userid_fkey ( id )")
    .eq("groupid", invitation.groupid)
    .eq("status", "active");

  const member = (membersSummary ?? []).find(
    (m: { role: string; user: { id: string }[] | { id: string } | null }) => {
      const userRef = Array.isArray(m.user) ? m.user[0] : m.user;
      return userRef?.id === user.id;
    },
  ) as { role: string } | undefined;

  const isAdmin = member?.role === "admin";

  if (!isOwner && !isAdmin) {
    return {
      data: null,
      error: { message: "Only the group owner can cancel invitations" },
    };
  }

  const { error: deleteError } = await supabase
    .from("groupinvites")
    .delete()
    .eq("id", invitationId);

  if (deleteError) {
    return {
      data: null,
      error: {
        message: deleteError.message ?? "Failed to cancel invitation",
      },
    };
  }

  return { data: { success: true }, error: null };
}

