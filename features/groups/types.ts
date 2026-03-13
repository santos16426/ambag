export type GroupRole = "admin" | "member";

export interface GroupMember {
  id: string;
  role: GroupRole;
  joined_at: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface JoinRequest {
  id: string;
  status: string;
  requested_at: string;
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  invited_at: string;
  invited_by: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export interface GroupMembersSummary {
  members: GroupMember[];
  join_requests: JoinRequest[];
  pending_invitations: PendingInvitation[];
  counts: {
    members_count: number;
    join_requests_count: number;
    pending_invitations_count: number;
  };
}

