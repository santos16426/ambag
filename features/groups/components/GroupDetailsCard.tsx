"use client";

import { useState } from "react";

import type { Group } from "@/features/dashboard/types";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useCopyInviteCode } from "@/features/groups/hooks/useCopyInviteCode";
import { useGroupCoverImageUpload } from "@/features/groups/hooks/useGroupCoverImageUpload";
import { useGroupDetailsEditing } from "@/features/groups/hooks/useGroupDetailsEditing";
import { updateGroupDetails } from "@/features/groups/services/group-details.service";
import { useGroupDetailsStore } from "@/features/groups/store/group-details.store";
import {
  Archive,
  Camera,
  Check,
  Copy,
  Edit2,
  ImageMinus,
  Loader2,
  X,
} from "lucide-react";
import { PremiumMeshBackground } from "./Skeleton";
import { toast } from "sonner";
import Image from "next/image";
interface GroupDetailsCardProps {
  group: Group;
}

export default function GroupDetailsCard({ group }: GroupDetailsCardProps) {
  const sessionUser = useAuthStore((s) => s.sessionUser);
  const { copiedCode, copyInviteCode } = useCopyInviteCode();
  const setGroupDetails = useGroupDetailsStore((s) => s.setGroupDetails);
  const isArchived = group.archivedat != null;
  const isOwner = sessionUser?.id != null && sessionUser.id === group.createdby;
  const [isArchiving, setIsArchiving] = useState(false);
  const {
    fileInputRef,
    imageUploading,
    imageRemoving,
    handleImageUpload,
    handleRemoveImage,
  } = useGroupCoverImageUpload(group.id, group.imagepath);
  const {
    editingField,
    tempValue,
    setTempValue,
    isSaving,
    startEditing,
    cancelEdit,
    saveEdit,
  } = useGroupDetailsEditing({
    onSave: async (field, value) => {
      const payload =
        field === "name" ? { name: value } : { description: value || null };
      const { error } = await updateGroupDetails(group.id, payload);
      if (error) {
        toast.error("Failed to update");
        throw error;
      }
      setGroupDetails(group.id, payload);
    },
  });

  async function handleArchiveGroup() {
    if (!isOwner || isArchived || isArchiving) return;
    setIsArchiving(true);
    const archivedAt = new Date().toISOString();
    const { error } = await updateGroupDetails(group.id, { archivedAt });
    setIsArchiving(false);
    if (error) {
      toast.error("Failed to archive group");
      return;
    }
    setGroupDetails(group.id, { archivedat: archivedAt });
    toast.success("Group archived. This group is now read-only.");
  }

  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-sm min-h-[220px]">
      <div className="group relative w-full h-[220px] lg:h-[350px] bg-slate-900 overflow-hidden">
        {group.imageurl ? (
          <Image
            width={100}
            height={100}
            src={group.imageurl}
            className="absolute inset-0 w-full h-full object-cover opacity-60 transition-transform duration-700 group-hover:scale-105"
            alt="Banner"
          />
        ) : (
          <PremiumMeshBackground />
        )}

        <div className="absolute inset-0 bg-linear-to-t from-slate-900 via-slate-900/40 to-transparent z-10" />

        <div className="relative z-20 h-full p-8 flex flex-col justify-between">
          <div className="flex justify-end items-start">
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isArchived || imageUploading || imageRemoving}
                className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-lg text-white hover:bg-white/20 transition-all shadow-lg disabled:opacity-50"
                title="Change cover"
              >
                {imageUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              {group.imageurl && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={isArchived || imageUploading || imageRemoving}
                  className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-lg text-white hover:bg-red-500/30 transition-all shadow-lg disabled:opacity-50"
                  title="Remove cover"
                  aria-label="Remove cover image"
                >
                  {imageRemoving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ImageMinus className="w-4 h-4" />
                  )}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          <div className="flex justify-between items-end gap-4">
            <div className="flex-1 space-y-2">
              {editingField === "name" ? (
                <div className="flex items-center gap-2">
                  <input
                    className="bg-white/20 backdrop-blur-md border border-white/30 rounded px-2 py-1 text-2xl font-bold text-white outline-none w-full"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={isArchived || isSaving}
                    className="p-1.5 bg-emerald-500 text-white rounded-md disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="p-1.5 bg-white/10 text-white rounded-md"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group/title">
                  <h2 className="text-3xl font-bold text-white leading-none">
                    {group.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => startEditing("name", group.name)}
                    disabled={isArchived}
                    className="opacity-0 group-hover/title:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-white/70" />
                  </button>
                </div>
              )}

              {editingField === "description" ? (
                <div className="flex items-start gap-2">
                  <textarea
                    className="bg-white/20 backdrop-blur-md border border-white/30 rounded px-2 py-1 text-sm text-slate-200 outline-none w-full h-16 resize-none"
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    autoFocus
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={isArchived || isSaving}
                      className="p-1.5 bg-emerald-500 text-white rounded-md disabled:opacity-50"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="p-1.5 bg-white/10 text-white rounded-md"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 group/desc max-w-md">
                  <p className="text-sm text-slate-200 leading-relaxed opacity-90 line-clamp-2">
                    {group.description ?? ""}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      startEditing("description", group.description ?? "")
                    }
                    disabled={isArchived}
                    className="opacity-0 group-hover/desc:opacity-100 p-1 mt-0.5 hover:bg-white/10 rounded transition-all shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-white/70" />
                  </button>
                </div>
              )}

              {group.invitecode && (
                <div className="flex items-center gap-2 pt-1">
                  <code className="text-sm font-mono font-medium text-white bg-white/10 px-2 py-1 rounded">
                    {group.invitecode}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyInviteCode(group.invitecode ?? "")}
                    className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Copy invite code"
                  >
                    {copiedCode === group.invitecode ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 opacity-80" />
                    )}
                  </button>
                </div>
              )}
            </div>
            {isOwner && !isArchived && (
              <button
                type="button"
                onClick={handleArchiveGroup}
                disabled={isArchiving}
                className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-amber-700 hover:bg-amber-100 disabled:opacity-60"
              >
                {isArchiving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Archive className="h-3.5 w-3.5" />
                )}
                Archive
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
