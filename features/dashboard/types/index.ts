export type GroupRole = "admin" | "member";

export interface GroupCreator {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  invite_code: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  // Optional aggregated data from getUserGroupsSummary
  member_count?: number;
  pending_join_requests_count?: number;
  pending_invitations_count?: number;
  user_role?: GroupRole;
  joined_at?: string;
  total_expenses?: number;
  total_settlements?: number;
}

