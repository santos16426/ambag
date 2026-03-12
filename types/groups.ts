/**
 * Minimal group shape for app shell (public.groups camelCase columns).
 */
export interface Group {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  imageUrl: string | null;
  archivedAt: string | null;
  inviteCode: string;
}
