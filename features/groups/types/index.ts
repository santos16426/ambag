export type GroupDetailMemberType = "member" | "pending_invite";

export interface GroupSummaryUserDetails {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  email?: string | null;
}

export interface GroupSummaryMember {
  userId: string;
  amount: number;
  userDetails: GroupSummaryUserDetails;
}

export interface GroupSummaryBreakdown {
  total: number;
  members: GroupSummaryMember[];
}

export interface GroupSummaryListItem extends GroupSummaryMember {
  side: "owed" | "owing";
}

export interface GroupSummaryData {
  totalGroupExpenses: number;
  totalSettlements: number;
  owedByMe: GroupSummaryBreakdown;
  owedToMe: GroupSummaryBreakdown;
}

export interface GroupDetailMemberUser {
  id: string;
  email: string;
  fullname: string | null;
  avatarurl: string | null;
}

export interface GroupDetailMember {
  type: GroupDetailMemberType;
  id: string;
  role: string;
  joined_at: string | null;
  user: GroupDetailMemberUser | null;
  email: string | null;
  invited_at: string | null;
}

export interface GroupDetailsPayload {
  group: {
    id: string;
    name: string;
    description: string | null;
    invitecode: string | null;
    imageurl: string | null;
    createdat: string;
    archivedat: string | null;
    createdbyid: string;
    membercount: number;
    pendingjoinrequestcount: number;
    pendinginvitationcount: number;
    totalexpenses: number;
    totalsettlements: number;
    createdby: {
      id: string;
      fullname: string | null;
      avatarurl: string | null;
    } | null;
  };
  members: Array<{
    type: string;
    id: string;
    role: string;
    joined_at: string | null;
    user: {
      id: string;
      email: string;
      fullname: string | null;
      avatarurl: string | null;
    } | null;
    email: string | null;
    invited_at: string | null;
  }>;
}
