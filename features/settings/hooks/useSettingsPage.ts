"use client";

import { useEffect, useState, useRef, type ChangeEvent } from "react";

import { useAuthStore } from "@/features/auth";

import {
  type ProfileSettings,
  type PayoutMethod,
  type SettingsModalType,
} from "../types";
import {
  commitProfileAvatar,
  createBankPaymentMethod,
  createQrPaymentMethod,
  deletePaymentMethod,
  fetchSettingsSnapshot,
  updateProfileSettings,
  uploadProfileAvatar,
  uploadQrImage,
} from "../services/settings-service";
import {
  bankMethodSchema,
  qrMethodSchema,
} from "../schema/payment-method.schema";

interface NewMethodState {
  provider: string;
  accountName: string;
  accountNumber: string;
  // qrImage is the preview URL used in the UI
  qrImage: string | null;
  // qrPath is the storage path saved in Supabase
  qrPath: string | null;
}

interface UseSettingsPageResult {
  loading: boolean;
  profile: ProfileSettings | null;
  payoutMethods: PayoutMethod[];
  isEditingProfile: boolean;
  isModalOpen: boolean;
  modalType: SettingsModalType;
  modalStep: "form" | "success";
  newMethod: NewMethodState;
  createdMethod: PayoutMethod | null;
  isSubmittingMethod: boolean;
  submitMethodError: string | null;
  avatarInputRef: React.RefObject<HTMLInputElement | null>;
  qrInputRef: React.RefObject<HTMLInputElement | null>;
  startEditingProfile: () => void;
  cancelEditingProfile: () => void;
  saveProfile: () => void;
  setProfileName: (value: string) => void;
  openBankModal: () => void;
  openQrModal: () => void;
  closeModal: () => void;
  setNewMethodField: (field: keyof NewMethodState, value: string | null) => void;
  confirmAddMethod: () => void;
  completeMethodSuccess: () => void;
  removeMethod: (id: string) => void;
  handleAvatarChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleQrUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}


export function useSettingsPage(): UseSettingsPageResult {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [initialProfile, setInitialProfile] = useState<ProfileSettings | null>(
    null,
  );
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<SettingsModalType>(null);
  const [modalStep, setModalStep] = useState<"form" | "success">("form");
  const [newMethod, setNewMethod] = useState<NewMethodState>({
    provider: "",
    accountName: "",
    accountNumber: "",
    qrImage: null,
    qrPath: null,
  });
  const [createdMethod, setCreatedMethod] = useState<PayoutMethod | null>(null);
  const [isSubmittingMethod, setIsSubmittingMethod] = useState(false);
  const [submitMethodError, setSubmitMethodError] = useState<string | null>(
    null,
  );

  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const qrInputRef = useRef<HTMLInputElement | null>(null);

  const sessionUser = useAuthStore((state) => state.sessionUser);

  useEffect(() => {
    const userId = sessionUser?.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    async function load() {
      try {
        const snapshot = await fetchSettingsSnapshot(userId as string);
        if (cancelled) return;
        setProfile(snapshot.profile);
        setInitialProfile(snapshot.profile);
        setPayoutMethods(snapshot.payoutMethods);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [sessionUser?.id]);

  function startEditingProfile() {
    setIsEditingProfile(true);
  }

  function cancelEditingProfile() {
    if (initialProfile) {
      setProfile(initialProfile);
    }
    setIsEditingProfile(false);
  }

  function saveProfile() {
    if (!profile) return;
    const pendingPath = profile.pendingAvatarPath;
    const currentPath = profile.avatarPath ?? null;
    updateProfileSettings(profile)
      .then(async () => {
        if (pendingPath) {
          await commitProfileAvatar(profile.id, pendingPath, currentPath);
          setProfile((prev) => {
            if (!prev) return prev;
            const updated: ProfileSettings = {
              ...prev,
              avatarPath: pendingPath,
              pendingAvatarPath: null,
            };
            setInitialProfile(updated);
            return updated;
          });
        } else {
          setInitialProfile(profile);
        }
      })
      .finally(() => {
        setIsEditingProfile(false);
      });
  }

  function setProfileName(value: string) {
    setProfile((prev) => (prev ? { ...prev, fullName: value } : prev));
  }

  function openBankModal() {
    setModalType("bank");
    setIsModalOpen(true);
    setModalStep("form");
    setSubmitMethodError(null);
    setCreatedMethod(null);
    setNewMethod({
      provider: "",
      accountName: profile?.fullName ?? "",
      accountNumber: "",
      qrImage: null,
      qrPath: null,
    });
  }

  function openQrModal() {
    setModalType("qr");
    setIsModalOpen(true);
    setModalStep("form");
    setSubmitMethodError(null);
    setCreatedMethod(null);
    setNewMethod({
      provider: "",
      accountName: "",
      accountNumber: "",
      qrImage: null,
      qrPath: null,
    });
  }

  function closeModal() {
    setIsModalOpen(false);
    setModalType(null);
    setModalStep("form");
    setSubmitMethodError(null);
    setCreatedMethod(null);
    setNewMethod({
      provider: "",
      accountName: "",
      accountNumber: "",
      qrImage: null,
      qrPath: null,
    });
  }

  function setNewMethodField(field: keyof NewMethodState, value: string | null) {
    setNewMethod((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function confirmAddMethod() {
    if (!modalType) return;

    setSubmitMethodError(null);

    if (modalType === "bank") {
      const validation = bankMethodSchema.safeParse({
        provider: newMethod.provider,
        accountName: newMethod.accountName,
        accountNumber: newMethod.accountNumber,
      });

      if (!validation.success) {
        const firstIssue = validation.error.issues[0];
        setSubmitMethodError(firstIssue?.message ?? "Invalid bank details");
        return;
      }

      setIsSubmittingMethod(true);
      createBankPaymentMethod({
        bankType: newMethod.provider,
        accountName: newMethod.accountName,
        accountNumber: newMethod.accountNumber,
      })
        .then((created) => {
          setPayoutMethods((prev) => [...prev, created]);
          setCreatedMethod(created);
          setModalStep("success");
        })
        .catch((error: unknown) => {
          const message =
            error instanceof Error
              ? error.message
              : "Failed to add bank method";
          setSubmitMethodError(message);
        })
        .finally(() => {
          setIsSubmittingMethod(false);
        });
      return;
    }

    if (!newMethod.qrPath) {
      const validation = qrMethodSchema.safeParse({
        qrImage: newMethod.qrPath ?? "",
      });
      if (!validation.success) {
        const firstIssue = validation.error.issues[0];
        setSubmitMethodError(firstIssue?.message ?? "QR image is required");
      }
      return;
    }

    setIsSubmittingMethod(true);
    createQrPaymentMethod(newMethod.qrPath)
      .then((created) => {
        setPayoutMethods((prev) => [...prev, created]);
        setCreatedMethod(created);
        setModalStep("success");
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Failed to add QR method";
        setSubmitMethodError(message);
      })
      .finally(() => {
        setIsSubmittingMethod(false);
      });
  }

  function completeMethodSuccess() {
    closeModal();
  }

  function removeMethod(id: string) {
    deletePaymentMethod(id)
      .then(() => {
        setPayoutMethods((prev) => prev.filter((method) => method.id !== id));
      })
      .catch(() => {});
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !sessionUser?.id) return;

    uploadProfileAvatar(sessionUser.id, file).then((result) => {
      if (result.error || !result.path || !result.signedUrl) return;
      setProfile((prev) => {
        if (!prev) return prev;
        const updated: ProfileSettings = {
          ...prev,
          avatarUrl: result.signedUrl,
          pendingAvatarPath: result.path,
        };
        return updated;
      });
    });
  }

  function handleQrUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const userId = sessionUser?.id;
    if (!file || !userId) return;

    uploadQrImage(userId, file)
      .then((result) => {
        setNewMethod((prev) => ({
          ...prev,
          // Use a local object URL for immediate preview
          qrImage: URL.createObjectURL(file),
          // Persist only the storage path; signed URLs come from the backend
          qrPath: result.path,
        }));
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : "Failed to upload QR image";
        setSubmitMethodError(message);
      });
  }

  return {
    loading,
    profile,
    payoutMethods,
    isEditingProfile,
    isModalOpen,
    modalType,
    modalStep,
    newMethod,
    createdMethod,
    isSubmittingMethod,
    submitMethodError,
    avatarInputRef,
    qrInputRef,
    startEditingProfile,
    cancelEditingProfile,
    saveProfile,
    setProfileName,
    openBankModal,
    openQrModal,
    closeModal,
    setNewMethodField,
    confirmAddMethod,
    completeMethodSuccess,
    removeMethod,
    handleAvatarChange,
    handleQrUpload,
  };
}

