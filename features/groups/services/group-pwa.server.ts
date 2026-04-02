import { createClient } from "@/lib/supabase/server";

/**
 * Group name for PWA manifest metadata (install label). Uses the same RPC as
 * the client so RLS / membership rules apply; returns null if unauthenticated
 * or the group is not visible.
 */
export async function getGroupNameForPwaManifest(
  groupId: string,
): Promise<string | null> {
  if (!groupId.trim()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("getgroupdetails", {
    p_group_id: groupId,
  });

  if (error || data == null || typeof data !== "object" || !("group" in data)) {
    return null;
  }

  const group = (data as { group: { name?: unknown } }).group;
  return typeof group?.name === "string" && group.name.trim() !== ""
    ? group.name
    : null;
}
