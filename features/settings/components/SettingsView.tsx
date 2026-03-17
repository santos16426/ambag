"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Pencil,
  Save,
  ShieldCheck,
  User,
} from "lucide-react";

import { useSettingsPage } from "../hooks/useSettingsPage";
import { PaymentMethodsSection } from "./PaymentMethodsSection";
import { BankForm } from "./BankForm";
import { QRForm } from "./QRForm";

export function SettingsView() {
  const {
    loading,
    profile,
    payoutMethods,
    isEditingProfile,
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
  } = useSettingsPage();

  const [isBankFormOpen, setIsBankFormOpen] = useState(false);
  const [isQrFormOpen, setIsQrFormOpen] = useState(false);

  if (loading || !profile) {
    return (
      <div className="w-full min-h-screen p-6 md:p-10 flex justify-center bg-slate-50/30">
        <div className="w-full max-w-2xl space-y-4">
          <div className="h-6 w-24 rounded bg-slate-200" />
          <div className="h-4 w-40 rounded bg-slate-100" />
          <div className="mt-8 space-y-4">
            <div className="h-40 rounded-[32px] bg-slate-100" />
            <div className="h-40 rounded-[32px] bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6 md:p-10 flex justify-center bg-slate-50/30">
      <div className="w-full max-w-2xl space-y-12 pb-24">
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Home
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              Settings
            </h1>
            <p className="text-slate-500 font-medium">
              Manage your personal information and payout preferences.
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Personal Identity
            </h3>
            {!isEditingProfile ? (
              <button
                type="button"
                onClick={startEditingProfile}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
              >
                <Pencil size={14} /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cancelEditingProfile}
                  className="items-center text-xs font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl flex gap-2 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg shadow-md shadow-blue-100 transition-all"
                >
                  <Save size={14} /> Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="relative group">
                <button
                  type="button"
                  className={`w-28 h-28 rounded-[40px] bg-slate-100 border-4 border-white shadow-inner overflow-hidden flex items-center justify-center transition-all ${
                    isEditingProfile
                      ? "ring-2 ring-blue-100 cursor-pointer scale-105"
                      : ""
                  }`}
                  onClick={() => {
                    if (isEditingProfile && avatarInputRef.current) {
                      avatarInputRef.current.click();
                    }
                  }}
                >
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl ?? undefined}
                      className="w-full h-full object-cover"
                      alt="Avatar"
                    />
                  ) : (
                    <User size={48} className="text-slate-300" />
                  )}
                  {isEditingProfile && (
                    <div className="absolute inset-0 bg-blue-600/10 flex items-center justify-center backdrop-blur-[2px]">
                      <Camera size={24} className="text-blue-600 opacity-50" />
                    </div>
                  )}
                </button>
                {isEditingProfile && (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </>
                )}
              </div>

              <div className="flex-1 space-y-4 w-full text-center md:text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                    Account Name
                  </label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-100 focus:border-blue-500 rounded-2xl p-3.5 font-bold text-slate-800 outline-none"
                      value={profile.fullName}
                      onChange={(event) => setProfileName(event.target.value)}
                    />
                  ) : (
                    <div className="text-xl font-bold text-slate-900 px-1">
                      {profile.fullName}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 flex items-center justify-center md:justify-start gap-1">
                    Verified Email{" "}
                    <ShieldCheck size={12} className="text-emerald-500" />
                  </label>
                  <div className="text-sm font-semibold text-slate-400 bg-slate-50 py-2.5 px-4 rounded-xl border border-dashed border-slate-200 inline-block">
                    {profile.email}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <PaymentMethodsSection
          loading={loading}
          payoutMethods={payoutMethods}
          onAddBank={() => {
            setIsBankFormOpen(true);
            openBankModal();
          }}
          onAddQr={() => {
            setIsQrFormOpen(true);
            openQrModal();
          }}
          onRemoveMethod={removeMethod}
        />
      </div>

      <BankForm
        isOpen={isBankFormOpen}
        onClose={() => {
          setIsBankFormOpen(false);
          closeModal();
        }}
        step={modalStep}
        profile={profile}
        bankName={newMethod.provider}
        accountNumber={newMethod.accountNumber}
        accountName={newMethod.accountName}
        isSubmitting={isSubmittingMethod}
        error={submitMethodError}
        onChangeBankName={(value) => setNewMethodField("provider", value)}
        onChangeAccountNumber={(value) =>
          setNewMethodField("accountNumber", value)
        }
        onChangeAccountName={(value) => setNewMethodField("accountName", value)}
        onSubmit={confirmAddMethod}
        onSuccess={() => {
          completeMethodSuccess();
          setIsBankFormOpen(false);
        }}
      />

      <QRForm
        isOpen={isQrFormOpen}
        onClose={() => {
          setIsQrFormOpen(false);
          closeModal();
        }}
        step={modalStep}
        qrImage={newMethod.qrImage}
        isSubmitting={isSubmittingMethod}
        error={submitMethodError}
        qrInputRef={qrInputRef}
        onUpload={handleQrUpload}
        onSubmit={confirmAddMethod}
        onSuccess={() => {
          completeMethodSuccess();
          setIsQrFormOpen(false);
        }}
      />
    </div>
  );
}
