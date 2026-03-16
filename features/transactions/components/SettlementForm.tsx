"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Banknote, Calendar, Check, Loader2, X } from "lucide-react";
import { EXPENSE_FORM_CURRENCY } from "../constants/expense-form";
import {
  FORM_CARD_TRANSITION,
  FORM_OVERLAY_TRANSITION,
} from "../constants/forms";
import {
  submitSettlement,
  updateSettlement,
} from "../services/transaction-submit.service";
import type { TransactionItemSettlement, TransactionUser } from "../types";
import { SettlementSuccessView } from "./SettlementSuccessView";
import type { SettlementSuccessData } from "./SettlementSuccessView";

export interface SettlementFormMember {
  id: string;
  fullname: string | null;
  email: string;
}

function memberToTransactionUser(m: SettlementFormMember): TransactionUser {
  return { id: m.id, name: m.fullname, avatar: null };
}

interface SettlementFormProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: SettlementFormMember[];
  currentUserId?: string | null;
  onSuccess?: (item: TransactionItemSettlement) => void;
  initialPayerId?: string | null;
  initialReceiverId?: string | null;
  initialAmount?: number | null;
  editingSettlement?: TransactionItemSettlement | null;
  maxAmount?: number | null;
}

export function SettlementForm({
  isOpen,
  onClose,
  groupId,
  members,
  currentUserId,
  onSuccess,
  initialPayerId,
  initialReceiverId,
  initialAmount,
  editingSettlement,
  maxAmount,
}: SettlementFormProps) {
  const isEditMode = editingSettlement != null;
  const defaultFrom = currentUserId ?? members[0]?.id ?? "";
  const defaultTo =
    members.find((m) => m.id !== defaultFrom)?.id ?? members[0]?.id ?? "";

  const [step, setStep] = useState<"form" | "success">("form");
  const [amount, setAmount] = useState("");
  const [fromUser, setFromUser] = useState(defaultFrom);
  const [toUser, setToUser] = useState(defaultTo);
  const [settledAt, setSettledAt] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<SettlementSuccessData | null>(
    null,
  );

  // When opening, prime the form from editingSettlement or initial props.
  useEffect(() => {
    if (!isOpen) return;

    if (editingSettlement) {
      setFromUser(editingSettlement.payerid);
      setToUser(editingSettlement.receiverid);
      setAmount(editingSettlement.amount.toString());
      return;
    }

    if (initialPayerId) {
      setFromUser(initialPayerId);
    } else if (!fromUser) {
      setFromUser(defaultFrom);
    }

    if (initialReceiverId) {
      setToUser(initialReceiverId);
    } else if (!toUser) {
      setToUser(defaultTo);
    }

    if (initialAmount != null) {
      setAmount(initialAmount.toString());
    }
  }, [
    isOpen,
    editingSettlement,
    initialPayerId,
    initialReceiverId,
    initialAmount,
    defaultFrom,
    defaultTo,
    fromUser,
    toUser,
  ]);

  const amountNum = parseFloat(amount) || 0;
  const fromMember = members.find((m) => m.id === fromUser);
  const toMember = members.find((m) => m.id === toUser);
  const isValid = amountNum > 0 && fromUser && toUser && fromUser !== toUser;

  function displayName(m: SettlementFormMember | undefined, id: string) {
    if (!m) return "—";
    if (id === currentUserId) return "Me";
    return m.fullname ?? m.email;
  }

  function resetAndClose() {
    setStep("form");
    setAmount("");
    setFromUser(defaultFrom);
    setToUser(defaultTo);
    setSettledAt(new Date().toISOString().split("T")[0]);
    setError(null);
    setSuccessData(null);
    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    setError(null);
    setIsSubmitting(true);

    if (isEditMode && editingSettlement) {
      const { data: updatedRow, error: updateError } = await updateSettlement({
        settlementId: editingSettlement.id,
        amount: amountNum,
      });

      setIsSubmitting(false);

      if (updateError || !updatedRow) {
        setError(updateError?.message ?? "Failed to update settlement");
        return;
      }

      const item: TransactionItemSettlement = {
        ...editingSettlement,
        amount: Number(updatedRow.amount),
        receipturl: updatedRow.receipturl ?? null,
      };

      onSuccess?.(item);
      resetAndClose();
      return;
    }

    let effectiveAmount = amountNum;
    let extraAmount = 0;

    if (maxAmount != null && amountNum > maxAmount) {
      const overpay = amountNum - maxAmount;
      // eslint-disable-next-line no-alert
      const createExtraTransfer = window.confirm(
        `You only owe ${EXPENSE_FORM_CURRENCY.symbol}${maxAmount.toFixed(
          2,
        )}.\n\nClick OK to settle ${EXPENSE_FORM_CURRENCY.symbol}${maxAmount.toFixed(
          2,
        )} and record an extra transfer of ${EXPENSE_FORM_CURRENCY.symbol}${overpay.toFixed(
          2,
        )}.\nClick Cancel to adjust the amount to what you owe.`,
      );

      if (createExtraTransfer) {
        effectiveAmount = maxAmount;
        extraAmount = overpay;
      } else {
        setAmount(maxAmount.toString());
        setIsSubmitting(false);
        return;
      }
    }

    const { data, error } = await submitSettlement({
      groupId,
      payerId: fromUser,
      receiverId: toUser,
      amount: effectiveAmount,
      receiptUrl: null,
    });

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
      return;
    }

    const row = data?.settlement;
    if (!row) {
      setError("Failed to create settlement");
      setIsSubmitting(false);
      return;
    }

    const item: TransactionItemSettlement = {
      type: "settlement",
      id: row.id,
      groupid: row.groupid,
      amount: Number(row.amount),
      createdat: row.createdat,
      date: settledAt,
      receipturl: row.receipturl ?? null,
      payerid: row.payerid,
      receiverid: row.receiverid,
      payer: fromMember ? memberToTransactionUser(fromMember) : null,
      receiver: toMember ? memberToTransactionUser(toMember) : null,
    };

    if (extraAmount > 0) {
      await submitSettlement({
        groupId,
        payerId: toUser,
        receiverId: fromUser,
        amount: extraAmount,
        receiptUrl: null,
      });
    }

    setSuccessData({
      fromUserId: fromUser,
      toUserId: toUser,
      amount: amountNum,
    });
    setStep("success");
    onSuccess?.(item);
    setIsSubmitting(false);
  }

  function handleFromChange(value: string) {
    setFromUser(value);
    if (toUser === value) {
      setToUser(members.find((m) => m.id !== value)?.id ?? "");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settlement-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={FORM_OVERLAY_TRANSITION}
          className="fixed inset-0 z-100 overflow-y-auto bg-[#F8F9FD]/98 backdrop-blur-md flex items-center justify-center p-4"
        >
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="settlement-form"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 4 }}
                transition={FORM_CARD_TRANSITION}
                className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
              >
                <div className="p-8 pb-6 flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                      {isEditMode ? "Edit Settlement" : "Record Settlement"}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {isEditMode ? "Update settlement amount" : "Who paid whom"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">
                        Sender
                      </label>
                      <select
                        value={fromUser}
                        onChange={(e) => handleFromChange(e.target.value)}
                        disabled={isEditMode}
                        className="w-full h-12 px-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white text-sm font-bold text-slate-900 outline-none transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {displayName(m, m.id)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">
                        Recipient
                      </label>
                      <select
                        value={toUser}
                        onChange={(e) => setToUser(e.target.value)}
                        disabled={isEditMode}
                        className="w-full h-12 px-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white text-sm font-bold text-slate-900 outline-none transition-all appearance-none disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {members
                          .filter((m) => m.id !== fromUser)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {displayName(m, m.id)}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">
                      Amount
                    </label>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white transition-all">
                      <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <Banknote className="text-emerald-600 w-5 h-5" />
                      </div>
                      <span className="text-xl font-black text-slate-500">
                        {EXPENSE_FORM_CURRENCY.symbol}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1 text-xl font-black text-slate-900 bg-transparent outline-none placeholder:text-slate-300"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">
                      Date
                    </label>
                    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white transition-all">
                      <Calendar className="w-5 h-5 text-indigo-500" />
                      <input
                        type="date"
                        value={settledAt}
                        onChange={(e) => setSettledAt(e.target.value)}
                        className="flex-1 text-sm font-bold text-slate-900 bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                      <p className="text-sm font-bold text-red-700">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={resetAndClose}
                      className="px-6 h-14 rounded-2xl font-black text-[10px] uppercase text-slate-400 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isValid || isSubmitting}
                      className="flex-1 h-14 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all disabled:opacity-20"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          {isEditMode ? "Save Changes" : "Record Settlement"}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : successData ? (
              <motion.div
                key="settlement-success-wrap"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full my-auto flex justify-center"
              >
                <SettlementSuccessView
                  data={successData}
                  members={members}
                  currentUserId={currentUserId}
                  currencySymbol={EXPENSE_FORM_CURRENCY.symbol}
                  onDone={resetAndClose}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
