import { createClient } from "@/lib/supabase/client";

export type UploadBucket = "groups" | "receipts" | "avatars";

export async function uploadImage(
  bucket: UploadBucket,
  path: string,
  file: File,
): Promise<{ url: string; error: Error | null }> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  if (error) {
    console.error("Storage upload error:", error);
    return { url: "", error };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { url: publicUrl, error: null };
}

export function groupImagePath(groupId: string, file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  return `${groupId}.${ext}`;
}

