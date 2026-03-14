import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  getSignedGroupImageUrl,
  removeGroupImage,
  updateGroupImage,
} from "@/features/groups/services/group-details.service";
import { useGroupDetailsStore } from "@/features/groups/store/group-details.store";

export function useGroupCoverImageUpload(
  groupId: string,
  currentStoragePath?: string | null,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageRemoving, setImageRemoving] = useState(false);
  const setGroupImageUrl = useGroupDetailsStore((s) => s.setGroupImageUrl);

  async function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const file = e.target.files?.[0];
    if (!file || !groupId) return;
    setImageUploading(true);
    const { imageUrl, error } = await updateGroupImage(
      groupId,
      file,
      currentStoragePath,
    );
    setImageUploading(false);
    e.target.value = "";
    if (error) {
      toast.error("Failed to update cover image");
      return;
    }
    if (imageUrl) {
      const signedUrl = await getSignedGroupImageUrl(imageUrl);
      if (signedUrl) setGroupImageUrl(groupId, signedUrl, imageUrl);
      toast.success("Cover image updated");
    }
  }

  async function handleRemoveImage(): Promise<void> {
    if (!groupId) return;
    setImageRemoving(true);
    const { error } = await removeGroupImage(groupId, currentStoragePath);
    setImageRemoving(false);
    if (error) {
      toast.error("Failed to remove cover image");
      return;
    }
    setGroupImageUrl(groupId, null);
    toast.success("Cover image removed");
  }

  return {
    fileInputRef,
    imageUploading,
    imageRemoving,
    handleImageUpload,
    handleRemoveImage,
  };
}
