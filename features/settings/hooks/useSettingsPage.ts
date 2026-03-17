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
} from "../services/settings-service";

interface NewMethodState {
  provider: string;
  accountName: string;
  accountNumber: string;
  qrImage: string | null;
}

interface UseSettingsPageResult {
  loading: boolean;
  profile: ProfileSettings | null;
  payoutMethods: PayoutMethod[];
  isEditingProfile: boolean;
  isModalOpen: boolean;
  modalType: SettingsModalType;
  newMethod: NewMethodState;
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
  const [newMethod, setNewMethod] = useState<NewMethodState>({
    provider: "",
    accountName: "",
    accountNumber: "",
    qrImage: null,
  });

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
    setNewMethod({
      provider: "",
      accountName: "",
      accountNumber: "",
      qrImage: null,
    });
  }

  function openQrModal() {
    setModalType("qr");
    setIsModalOpen(true);
    setNewMethod({
      provider: "",
      accountName: "",
      accountNumber: "",
      qrImage: null,
    });
  }

  function closeModal() {
    setIsModalOpen(false);
    setModalType(null);
    setNewMethod({
      provider: "",
      accountName: "",
      accountNumber: "",
      qrImage: null,
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

    if (modalType === "bank") {
      createBankPaymentMethod({
        bankType: newMethod.provider,
        accountName: newMethod.accountName,
        accountNumber: newMethod.accountNumber,
      })
        .then((created) => {
          setPayoutMethods((prev) => [...prev, created]);
          closeModal();
        })
        .catch(() => {
          closeModal();
        });
      return;
    }

    if (!newMethod.qrImage) return;

    createQrPaymentMethod(newMethod.qrImage)
      .then((created) => {
        setPayoutMethods((prev) => [...prev, created]);
        closeModal();
      })
      .catch(() => {
        closeModal();
      });
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
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const qrImage = typeof reader.result === "string" ? reader.result : null;
      if (!qrImage) return;
      setNewMethod((prev) => ({
        ...prev,
        qrImage,
      }));
    };
    reader.readAsDataURL(file);
  }

  return {
    loading,
    profile,
    payoutMethods,
    isEditingProfile,
    isModalOpen,
    modalType,
    newMethod,
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
    removeMethod,
    handleAvatarChange,
    handleQrUpload,
  };
}

