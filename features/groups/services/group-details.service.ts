import { GROUP_IMAGES_BUCKET } from "@/constants/storage";
import { createClient } from "@/lib/supabase/client";

import type { Group } from "@/features/dashboard/types";

import type {
  GroupDetailMember,
  GroupDetailsPayload,
} from "../types";

export interface GetGroupDetailsResult {
  data: { group: Group; members: GroupDetailMember[] } | null;
  error: Error | null;
}

function mapRpcGroupToGroup(rpc: GroupDetailsPayload["group"]): Group {
  return {
    id: rpc.id,
    name: rpc.name,
    description: rpc.description,
    createdby: rpc.createdbyid,
    invitecode: rpc.invitecode,
    imageurl: rpc.imageurl ?? null,
    createdat: rpc.createdat,
    updatedat: rpc.createdat,
    membercount: rpc.membercount ?? 0,
    pendingjoinrequestcount: rpc.pendingjoinrequestcount ?? 0,
    pendinginvitationcount: rpc.pendinginvitationcount ?? 0,
    totalexpenses: rpc.totalexpenses ?? 0,
    totalsettlements: rpc.totalsettlements ?? 0,
  };
}

function mapRpcMemberToMember(
  m: GroupDetailsPayload["members"][number],
): GroupDetailMember {
  const avatarPath = m.user?.avatarurl ?? null;
  let avatarurl: string | null = avatarPath;

  if (avatarPath) {
    const supabase = createClient();
    const { data } = supabase.storage.from("avatars").getPublicUrl(avatarPath);
    avatarurl = data.publicUrl ?? avatarPath;
  }

  return {
    type: m.type as GroupDetailMember["type"],
    id: m.id,
    role: m.role,
    joined_at: m.joined_at,
    user: m.user
      ? {
          id: m.user.id,
          email: m.user.email,
          fullname: m.user.fullname,
          avatarurl,
        }
      : null,
    email: m.email,
    invited_at: m.invited_at,
  };
}

export async function getGroupDetails(
  groupId: string,
): Promise<GetGroupDetailsResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("getgroupdetails", {
    p_group_id: groupId,
  });

  if (error) {
    return { data: null, error };
  }

  if (!data || typeof data !== "object" || !("group" in data)) {
    return { data: null, error: new Error("Invalid response from getGroupDetails") };
  }

  const payload = data as GroupDetailsPayload;
  const group = mapRpcGroupToGroup(payload.group);
  const members = (payload.members ?? []).map(mapRpcMemberToMember);

  if (group.imageurl && !group.imageurl.startsWith("http")) {
    const storagePath = group.imageurl;
    group.imagepath = storagePath;
    const { data: signed } = await supabase.storage
      .from(GROUP_IMAGES_BUCKET)
      .createSignedUrl(storagePath, 60 * 60);
    if (signed?.signedUrl) {
      group.imageurl = signed.signedUrl;
    }
  }

  return { data: { group, members }, error: null };
}

/** Storage path for group cover; must start with "groups/" for RLS. */
function groupCoverPath(groupId: string, file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  return `groups/${groupId}/cover-${Date.now()}.${ext}`;
}

function deleteGroupImageFromBucket(path: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  return supabase.storage
    .from(GROUP_IMAGES_BUCKET)
    .remove([path])
    .then(({ error }) => ({ error: error ?? null }));
}

export interface UpdateGroupImageResult {
  imageUrl: string | null;
  error: Error | null;
}

/**
 * Deletes any existing cover from storage, uploads the new file, and updates the group via RPC.
 */
export async function updateGroupImage(
  groupId: string,
  file: File,
  currentStoragePath?: string | null,
): Promise<UpdateGroupImageResult> {
  const supabase = createClient();
  const path = groupCoverPath(groupId, file);

  if (currentStoragePath) {
    await deleteGroupImageFromBucket(currentStoragePath);
  }

  const { error: uploadError } = await supabase.storage
    .from(GROUP_IMAGES_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (uploadError) {
    return { imageUrl: null, error: uploadError };
  }

  const { error: saveError } = await supabase.rpc("saveimageurl", {
    payload: {
      entitytype: "group",
      entityid: groupId,
      imageurl: path,
    },
  });

  if (!saveError) {
    return { imageUrl: path, error: null };
  }

  const { error: updateError } = await supabase.rpc("updategroup", {
    groupid: groupId,
    payload: { imageUrl: path },
  });

  if (updateError) {
    return { imageUrl: null, error: updateError };
  }

  return { imageUrl: path, error: null };
}

/**
 * Deletes the cover from storage (if path given) and clears the group's image via RPC.
 */
export async function removeGroupImage(
  groupId: string,
  storagePath?: string | null,
): Promise<{ error: Error | null }> {
  const supabase = createClient();

  if (storagePath) {
    await deleteGroupImageFromBucket(storagePath);
  }

  const { error } = await supabase.rpc("removegroupimage", {
    groupid: groupId,
  });
  return { error: error ?? null };
}

/**
 * Returns a signed URL for a group image storage path (for display without refetch).
 */
export async function getSignedGroupImageUrl(
  path: string,
): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.storage
    .from(GROUP_IMAGES_BUCKET)
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

export interface UpdateGroupDetailsPayload {
  name?: string;
  description?: string | null;
}

/**
 * Updates group name/description via RPC.
 */
export async function updateGroupDetails(
  groupId: string,
  payload: UpdateGroupDetailsPayload,
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.rpc("updategroup", {
    groupid: groupId,
    payload,
  });
  return { error: error ?? null };
}
