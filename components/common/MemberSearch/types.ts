export interface MemberInvite {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  isExistingUser: boolean;
}
