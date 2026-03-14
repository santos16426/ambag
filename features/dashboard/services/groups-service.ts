import { GROUP_IMAGES_BUCKET } from "@/constants/storage";
import { createClient } from "@/lib/supabase/client";

interface CreateGroupInput {
  name: string;
  description?: string | null;
  memberIds: string[];
  inviteEmails?: string[];
  imageUrl?: string | null;
}

interface RpcCreateGroupPayload {
  group?: Record<string, unknown> | null;
  autoapproved?: boolean;
}
export async function uploadGroupImage(file: File): Promise<string> {
  const supabase = createClient();

  const fileExtension = file.name.split(".").pop() ?? "jpg";

  const uniqueName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExtension}`;

  const filePath = `temp/${uniqueName}`;

  const { data, error } = await supabase.storage
    .from(GROUP_IMAGES_BUCKET)
    .upload(filePath, file);

  if (error) throw error;
  return data.path;
}
export async function createGroup(
  input: CreateGroupInput,
): Promise<RpcCreateGroupPayload> {
  const response = await fetch("/api/groups/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    const message = body?.error ?? "Failed to create group";
    throw new Error(message);
  }

  const payload = (await response.json()) as RpcCreateGroupPayload | null;

  if (!payload?.group) {
    throw new Error("Group was not returned");
  }

  const group = payload.group as {
    id: string;
    imageurl?: string | null;
  };

  if (input.imageUrl && group.imageurl) {
    const supabase = createClient();
    const tempImagePath = input.imageUrl;
    const destination = group.imageurl;

    const { error } = await supabase.storage
      .from(GROUP_IMAGES_BUCKET)
      .move(tempImagePath, destination);
    if (error) console.error(error);
  }

  if (group.imageurl) {
    const supabase = createClient();
    const { data: signed, error: signedError } = await supabase.storage
      .from(GROUP_IMAGES_BUCKET)
      .createSignedUrl(group.imageurl, 60 * 60);

    if (signedError) {
      console.error(
        "Failed to create signed URL for new group image",
        signedError,
      );
    } else if (signed?.signedUrl) {
      group.imageurl = signed.signedUrl;
    }
  }

  return {
    ...payload,
    group,
  };
}

