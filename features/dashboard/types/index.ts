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
  archivedat?: string | null;
  createdby: string;
  invitecode: string | null;
  imageurl: string | null;
  /** Storage path for group cover (for delete); set when imageurl is present. */
  imagepath?: string | null;
  createdat: string;
  updatedat: string;
  membercount?: number;
  pendingjoinrequestcount?: number;
  pendinginvitationcount?: number;
  userrole?: GroupRole;
  joinedat?: string;
  totalexpenses?: number;
  totalsettlements?: number;
}

