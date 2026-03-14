import { useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useDashboardGroupsStore } from "../store/groups.store";
import { createGroup, uploadGroupImage } from "../services/groups-service";
import {
  groupFormSchema,
  type GroupFormValues,
} from "../schema/group-form.schema";
import type { MemberInvite } from "@/components/common/MemberSearch";

interface UseGroupFormProps {
  setIsOpen: (isOpen: boolean) => void;
  onSuccess?: () => void;
}

export function useGroupForm({ setIsOpen, onSuccess }: UseGroupFormProps) {
  const [step, setStep] = useState<"form" | "success">("form");

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberInvite[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const upsertGroupFromSummary = useDashboardGroupsStore(
    (s) => s.upsertGroupFromSummary,
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: { name: "", description: "" },
  });

  const name = watch("name");

  const memberIds = useMemo(
    () => members.filter((m) => m.isExistingUser).map((m) => m.id),
    [members],
  );

  const inviteEmails = useMemo(
    () =>
      members
        .filter((m) => !m.isExistingUser)
        .map((m) => m.email.toLowerCase())
        .filter((email, index, all) => all.indexOf(email) === index),
    [members],
  );

  const resetAndClose = () => {
    reset();
    setMembers([]);
    setSubmitError(null);
    setStep("form");
    setImagePreview(null);
    setImageUrl(null);
    setIsOpen(false);
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploading(true);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setSubmitError(null);

    try {
      const publicUrl = await uploadGroupImage(file);
      setImageUrl(publicUrl);
    } catch (err) {
      setImageUrl(null);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to upload image",
      );
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const onSubmit = async (values: GroupFormValues) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const payload = await createGroup({
        name: values.name,
        description: values.description ?? null,
        memberIds,
        inviteEmails,
        imageUrl,
      });

      const result = payload as {
        group?: Parameters<typeof upsertGroupFromSummary>[0] | null;
        autoapproved?: boolean;
      } | null;

      if (!result?.group) throw new Error("Group was not returned");

      upsertGroupFromSummary(result.group);

      setStep("success");
      onSuccess?.();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to create group",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMember = (member: MemberInvite) => {
    setMembers((prev) =>
      prev.some((m) => m.id === member.id) ? prev : [...prev, member],
    );
  };

  const handleRemoveMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  return {
    // state
    step,
    name,
    members,
    imagePreview,
    isSubmitting,
    submitError,
    isUploading,
    fileInputRef,
    errors,
    // form helpers
    register,
    handleSubmit,
    // actions
    resetAndClose,
    handleImage,
    onSubmit,
    handleAddMember,
    handleRemoveMember,
  };
}

