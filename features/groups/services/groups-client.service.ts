import { createClient } from "@/lib/supabase/client";

import type {
  GroupMember,
  JoinRequest,
  PendingInvitation,
  GroupMembersSummary,
} from "../types";

export interface GroupMembersSummaryResult {
  data: GroupMembersSummary | null;
  error: Error | null;
}

export async function getGroupMembersSummary(
  groupId: string,
): Promise<GroupMembersSummaryResult> {
  const supabase = createClient();

  const { data: membersData, error: membersError } = await supabase
    .from("groupmembers")
    .select(
      `
        id,
        role,
        joinedat,
        user:profiles!groupmembers_userid_fkey (
          id,
          email,
          fullname,
          avatarurl
        )
      `,
    )
    .eq("groupid", groupId)
    .eq("status", "active")
    .order("joinedat", { ascending: true });

  if (membersError) {
    console.error("Error fetching group members:", membersError);
    return { data: null, error: membersError };
  }

  const members: GroupMember[] = (membersData ?? []).map(
    (item: {
      id: string;
      role: string;
      joinedat: string;
      user: {
        id: string;
        email: string;
        fullname: string | null;
        avatarurl: string | null;
      } | null;
    }) => {
      const user = item.user;
      return {
        id: item.id,
        role: item.role as GroupMember["role"],
        joined_at: item.joinedat,
        user: {
          id: user?.id ?? "",
          email: user?.email ?? "",
          full_name: user?.fullname ?? null,
          avatar_url: user?.avatarurl ?? null,
        },
      };
    },
  );

  const { data: joinRequestsData, error: joinRequestsError } = await supabase
    .from("groupjoinrequests")
    .select(
      `
        id,
        status,
        requestedat,
        user:profiles!groupjoinrequests_userid_fkey (
          id,
          email,
          fullname,
          avatarurl
        )
      `,
    )
    .eq("groupid", groupId)
    .eq("status", "pending")
    .order("requestedat", { ascending: false });

  if (joinRequestsError) {
    console.error("Error fetching join requests:", joinRequestsError);
    return { data: null, error: joinRequestsError };
  }

  const join_requests: JoinRequest[] = (joinRequestsData ?? []).map(
    (item: {
      id: string;
      status: string;
      requestedat: string;
      user: {
        id: string;
        email: string;
        fullname: string | null;
        avatarurl: string | null;
      } | null;
    }) => {
      const user = item.user;
      return {
        id: item.id,
        status: item.status,
        requested_at: item.requestedat,
        user: {
          id: user?.id ?? "",
          email: user?.email ?? "",
          full_name: user?.fullname ?? null,
          avatar_url: user?.avatarurl ?? null,
        },
      };
    },
  );

  const { data: invitationsData, error: invitationsError } = await supabase
    .from("groupinvites")
    .select(
      `
        id,
        invitedemail,
        role,
        invitedat,
        invitedby:profiles!groupinvites_invitedby_fkey (
          id,
          fullname,
          email
        )
      `,
    )
    .eq("groupid", groupId)
    .eq("status", "pending")
    .order("invitedat", { ascending: false });

  if (invitationsError) {
    console.error("Error fetching pending invitations:", invitationsError);
    return { data: null, error: invitationsError };
  }

  const pending_invitations: PendingInvitation[] = (invitationsData ?? []).map(
    (item: {
      id: string;
      invitedemail: string;
      role: string;
      invitedat: string;
      invitedby:
        | {
            id: string;
            fullname: string | null;
            email: string;
          }
        | null;
    }) => ({
      id: item.id,
      email: item.invitedemail,
      role: item.role,
      invited_at: item.invitedat,
      invited_by: item.invitedby
        ? {
            id: item.invitedby.id,
            full_name: item.invitedby.fullname,
            email: item.invitedby.email,
          }
        : null,
    }),
  );

  const summary: GroupMembersSummary = {
    members,
    join_requests,
    pending_invitations,
    counts: {
      members_count: members.length,
      join_requests_count: join_requests.length,
      pending_invitations_count: pending_invitations.length,
    },
  };

  return { data: summary, error: null };
}

