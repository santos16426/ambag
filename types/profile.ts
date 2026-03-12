/**
 * Single source of truth for public.profiles row shape (camelCase matches schema).
 */
export interface Profile {
  id: string;
  fullname: string;
  avatarurl: string | null;
  email: string;
  createdat: string;
}
