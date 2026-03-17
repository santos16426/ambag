"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, PlusCircle, X } from "lucide-react";

import type { ProfileSettings, PayoutMethod } from "../types";

interface BankFormProps {
  isOpen: boolean;
  onClose: () => void;
  step: "form" | "success";
  profile: ProfileSettings | null;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isSubmitting?: boolean;
  error?: string | null;
  createdMethod?: PayoutMethod | null;
  onChangeBankName: (value: string) => void;
  onChangeAccountNumber: (value: string) => void;
  onChangeAccountName: (value: string) => void;
  onSubmit: () => void;
  onSuccess: () => void;
}

export function BankForm({
  isOpen,
  onClose,
  step,
  profile,
  bankName,
  accountNumber,
  accountName,
  isSubmitting = false,
  error = null,
  createdMethod,
  onChangeBankName,
  onChangeAccountNumber,
  onChangeAccountName,
  onSubmit,
  onSuccess,
}: BankFormProps) {
  if (!isOpen) return null;

  const defaultAccountName = profile?.fullName ?? "";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bank-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-100 overflow-y-auto bg-[#F8F9FD]"
        >
          <div className="max-w-xl mx-auto pt-10 px-4 pb-20">
            {/* Header / Close */}
            <div className="flex items-center justify-between mb-8 px-1">
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <X className="w-3 h-3" /> Close
              </button>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Bank Method
                </span>
              </div>
            </div>

            {step === "form" ? (
              <>
                {/* Preview card */}
                <motion.div
                  layoutId="bank-main-card"
                  className="bg-slate-950 rounded-[2rem] p-6 mb-10 flex items-center gap-5 shadow-2xl shadow-indigo-100 relative overflow-hidden border border-white/5"
                >
                  <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-950/60 to-transparent z-0" />
                  <div className="relative z-10 w-16 h-10 bg-linear-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg border border-white/10 text-white">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="relative z-10 flex-1 min-w-0">
                    <h2 className="text-white font-black text-sm tracking-widest truncate">
                      {accountName || defaultAccountName || "Account Name"}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1 truncate">
                      {bankName || "Bank / Wallet Provider"}
                    </p>
                  </div>
                </motion.div>

                {/* Form card */}
                <div className="space-y-4">
                  <div className="bg-white p-7 rounded-3xl border border-slate-100 shadow-sm focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                    <div className="flex items-center gap-2 mb-4">
                      <PlusCircle className="w-4 h-4 text-indigo-500" />
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        01. Bank Details
                      </label>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Bank Name
                        </label>
                        <input
                          autoFocus
                          className="w-full text-sm font-semibold outline-none placeholder:text-slate-300 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3"
                          placeholder="e.g. BPI, GCash"
                          value={bankName}
                          onChange={(event) =>
                            onChangeBankName(event.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Account Number
                        </label>
                        <input
                          className="w-full text-sm font-mono font-semibold outline-none placeholder:text-slate-300 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3"
                          placeholder="Account number"
                          value={accountNumber}
                          onChange={(event) =>
                            onChangeAccountNumber(event.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Account Name
                        </label>
                        <input
                          className="w-full text-sm font-semibold outline-none placeholder:text-slate-300 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3"
                          placeholder={defaultAccountName || "Account holder name"}
                          value={accountName}
                          onChange={(event) =>
                            onChangeAccountName(event.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                      <p className="text-xs font-bold text-red-700 text-center">
                        {error}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <button
                    type="button"
                    disabled={
                      isSubmitting ||
                      !bankName.trim() ||
                      !accountNumber.trim() ||
                      !accountName.trim()
                    }
                    onClick={onSubmit}
                    className="w-full h-16 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all disabled:opacity-30"
                  >
                    {isSubmitting ? (
                      <span className="text-[11px] tracking-[0.2em]">
                        Saving...
                      </span>
                    ) : (
                      <span className="text-[11px] tracking-[0.2em]">
                        Save Bank Method
                      </span>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center mt-10 space-y-8">
                <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-emerald-100">
                  <CreditCard className="w-10 h-10" />
                </div>
                <div className="w-full max-w-xs bg-slate-50 border border-slate-100 rounded-[2rem] p-5 flex items-center gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-white">
                    <CreditCard className="w-6 h-6 text-white/70" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                      New Bank Method
                    </p>
                    <h3 className="text-sm font-black text-slate-900 truncate">
                      {createdMethod?.type === "bank"
                        ? createdMethod.accountName ?? "Bank account"
                        : accountName || defaultAccountName || "Bank account"}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSuccess}
                  className="w-full max-w-xs py-5 bg-slate-950 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-xl"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

