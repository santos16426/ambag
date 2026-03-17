"use client";

import React from "react";
import {
  User,
  Camera,
  QrCode,
  Building2,
  X,
  Pencil,
  ShieldCheck,
  Save,
  CreditCard,
  Upload,
  Trash2,
} from "lucide-react";

import { useSettingsPage } from "../hooks/useSettingsPage";

export function SettingsView() {
  const {
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
  } = useSettingsPage();

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
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Settings
          </h1>
          <p className="text-slate-500 font-medium">
            Manage your personal information and payout preferences.
          </p>
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

        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Payout Sources
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openBankModal}
                className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
              >
                <Building2 size={14} /> Add Bank
              </button>
              <button
                type="button"
                onClick={openQrModal}
                className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
              >
                <QrCode size={14} /> Add QR
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[0, 1].map((item) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={item}
                  className="flex items-center gap-4 p-6 rounded-[32px] border-2 border-white bg-white shadow-sm animate-pulse"
                >
                  <div className="w-14 h-14 rounded-2xl bg-slate-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-24 rounded bg-slate-100" />
                    <div className="h-4 w-40 rounded bg-slate-100" />
                    <div className="h-3 w-32 rounded bg-slate-50" />
                  </div>
                  <div className="w-9 h-9 rounded-full bg-slate-100" />
                </div>
              ))}
            </div>
          ) : payoutMethods.length === 0 ? (
            <div className="rounded-[32px] border-2 border-dashed border-slate-200 bg-white py-10 px-6 text-center flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                <CreditCard size={18} />
              </div>
              <p className="text-sm font-semibold text-slate-600">
                No payout methods yet.
              </p>
              <p className="text-xs text-slate-400 max-w-xs">
                Add a bank account or upload a QR so friends know where to send
                your share.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {payoutMethods.map((method) => (
                <div
                  key={method.id}
                  className="group relative flex flex-col md:flex-row md:items-center gap-6 p-6 rounded-[32px] border-2 border-white bg-white shadow-sm transition-all"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                      method.type === "bank"
                        ? "bg-blue-600 text-white"
                        : "bg-emerald-500 text-white"
                    }`}
                  >
                    {method.type === "bank" ? (
                      <CreditCard size={28} />
                    ) : (
                      <QrCode size={28} />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                        {method.type === "bank"
                          ? (method.bankType ?? "Bank account")
                          : "QR METHOD"}
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">
                      {method.type === "bank"
                        ? (method.accountName ?? "Unnamed account")
                        : "Personal QR Code"}
                    </h4>
                    <p className="text-sm font-mono font-bold text-slate-400 tracking-widest">
                      {method.type === "bank"
                        ? method.accountNumber
                        : "Image Uploaded"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {method.type === "qr" && method.qrImage && (
                      <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 p-1 flex items-center justify-center overflow-hidden">
                        <img
                          src={method.qrImage}
                          className="w-full h-full object-contain"
                          alt="QR code"
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMethod(method.id)}
                      className="p-3 text-slate-300 hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-xl ${
                    modalType === "bank"
                      ? "bg-blue-600 text-white"
                      : "bg-emerald-500 text-white"
                  }`}
                >
                  {modalType === "bank" ? (
                    <Building2 size={20} />
                  ) : (
                    <QrCode size={20} />
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Add {modalType === "bank" ? "Bank" : "QR"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                confirmAddMethod();
              }}
              className="space-y-6"
            >
              {modalType === "bank" ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Provider
                    </label>
                    <input
                      required
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-2xl p-4 font-bold text-slate-800"
                      placeholder="e.g. BPI, GCash"
                      value={newMethod.provider}
                      onChange={(event) =>
                        setNewMethodField("provider", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Account Holder
                    </label>
                    <input
                      required
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-2xl p-4 font-bold text-slate-800"
                      placeholder="Legal Name"
                      value={newMethod.accountName}
                      onChange={(event) =>
                        setNewMethodField("accountName", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Account Number
                    </label>
                    <input
                      required
                      className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none rounded-2xl p-4 font-bold text-slate-800"
                      placeholder="Number"
                      value={newMethod.accountNumber}
                      onChange={(event) =>
                        setNewMethodField("accountNumber", event.target.value)
                      }
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-500 text-center px-4">
                    Upload your QR code image to receive payments directly.
                  </p>
                  <button
                    type="button"
                    onClick={() => qrInputRef.current?.click()}
                    className={`relative w-full aspect-square rounded-[32px] border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
                      newMethod.qrImage
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-slate-100 bg-slate-50 hover:border-blue-300"
                    }`}
                  >
                    {newMethod.qrImage ? (
                      <div className="w-full h-full p-6">
                        <img
                          src={newMethod.qrImage}
                          className="w-full h-full object-contain rounded-xl"
                          alt="QR preview"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-slate-300">
                        <div className="p-5 bg-white rounded-3xl shadow-sm ring-1 ring-slate-100">
                          <Upload size={32} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Select Image
                        </span>
                      </div>
                    )}
                    <input
                      ref={qrInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      required={!newMethod.qrImage}
                      onChange={handleQrUpload}
                    />
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={modalType === "qr" && !newMethod.qrImage}
                className={`w-full py-5 rounded-[24px] font-black text-white shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${
                  modalType === "bank"
                    ? "bg-blue-600 shadow-blue-200"
                    : "bg-emerald-600 shadow-emerald-200"
                }`}
              >
                Confirm Method
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
