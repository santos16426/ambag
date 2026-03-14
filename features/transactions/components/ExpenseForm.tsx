"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeftRight,
  Camera,
  Check,
  DollarSign,
  Equal,
  Hash,
  Loader2,
  Maximize2,
  Percent,
  Plus,
  PlusCircle,
  Receipt,
  Share2,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import getInitials from "@/lib/get-initials";
import type { SplitType } from "../types/expense-form";
import type { ExpenseFormProps } from "../types/expense-form";
import { EXPENSE_FORM_SPLIT_METHODS } from "../constants/expense-form";
import {
  FORM_CARD_TRANSITION,
  FORM_OVERLAY_TRANSITION,
} from "../constants/forms";
import { useExpenseForm } from "../hooks/useExpenseForm";
import { ExpenseSuccessReceipt } from "./ExpenseSuccessReceipt";

const SPLIT_METHOD_ICONS: Record<
  SplitType,
  React.ComponentType<{ className?: string }>
> = {
  equally: Equal,
  shares: Share2,
  percentage: Percent,
  exact: Hash,
  adjustments: PlusCircle,
  itemized: ShoppingCart,
  reimbursement: ArrowLeftRight,
};

export type { ExpenseFormMember, SplitType } from "../types/expense-form";

export function ExpenseForm({
  isOpen,
  onClose,
  groupId,
  members,
  currentUserId,
  onSuccess,
}: ExpenseFormProps) {
  const {
    step,
    description,
    setDescription,
    amount,
    setAmount,
    amountDisplay,
    expenseDate,
    setExpenseDate,
    payMode,
    setPayMode,
    singlePayer,
    setSinglePayer,
    effectiveSinglePayer,
    multiplePayers,
    splitType,
    setSplitType,
    memberSplits,
    selectedMembers,
    isSubmitting,
    error,
    successDescription,
    successAmount,
    successReceiptData,
    reimbursementTarget,
    setReimbursementTarget,
    items,
    receiptImage,
    fileInputRef,
    currencySymbol,
    isValid,
    remainingSplit,
    isBalanced,
    resetAndClose,
    handleReceiptChange,
    addItemizedItem,
    updateItem,
    removeItem,
    toggleItemAssignee,
    handleSubmit,
    toggleMember,
    handleSplitValueChange,
    handleMultiplePayerChange,
    clearReceipt,
  } = useExpenseForm({
    members,
    groupId,
    currentUserId,
    onClose,
    onSuccess,
  });

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="expense-form-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={FORM_OVERLAY_TRANSITION}
          className="fixed inset-0 z-100 overflow-y-auto bg-[#F8F9FD]/98 backdrop-blur-md flex justify-center items-start p-4"
        >
          <AnimatePresence>
            {isPreviewOpen && receiptImage && (
              <motion.div
                key="receipt-preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-110 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setIsPreviewOpen(false)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Escape" && setIsPreviewOpen(false)}
                aria-label="Close preview"
              >
                <button
                  type="button"
                  className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                  onClick={() => setIsPreviewOpen(false)}
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
                <img
                  src={receiptImage}
                  className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl"
                  alt="Receipt preview"
                  onClick={(e) => e.stopPropagation()}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="expense-form"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 4 }}
                transition={FORM_CARD_TRANSITION}
                className="my-auto w-full max-w-lg lg:max-w-6xl max-h-[calc(100vh-2rem)] overflow-hidden flex flex-col bg-white rounded-[2.5rem] shadow-2xl border border-slate-100"
              >
                <div className="p-8 pb-4 flex justify-between items-start shrink-0">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">
                      Add Expense
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Description, amount & split
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

                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col flex-1 min-h-0 overflow-hidden"
                >
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <div className="flex flex-col lg:flex-row min-h-0">
                      {/* Left: expense details + who paid */}
                      <div className="border-b lg:border-b-0 lg:border-r border-slate-100 px-8 pt-2 pb-6 lg:pt-8 lg:pb-8 space-y-6">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">
                            Receipt (optional)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleReceiptChange}
                            className="hidden"
                          />
                          {receiptImage ? (
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setIsPreviewOpen(true)}
                                className="group relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50"
                              >
                                <img
                                  src={receiptImage}
                                  alt="Receipt"
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Maximize2 className="w-4 h-4 text-white" />
                                </div>
                              </button>
                              <div className="flex flex-col gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-[9px] font-black uppercase text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit"
                                >
                                  <Camera className="w-3 h-3" /> Change
                                </button>
                                <button
                                  type="button"
                                  onClick={clearReceipt}
                                  className="text-[9px] font-black uppercase text-red-500 hover:text-red-600 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 w-fit"
                                >
                                  <Trash2 className="w-3 h-3" /> Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full h-20 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center gap-4 px-6 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all group"
                            >
                              <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Receipt className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <span className="text-[10px] font-black uppercase block">
                                  Add receipt
                                </span>
                                <span className="text-[9px] font-medium opacity-60">
                                  Snap a photo to attach
                                </span>
                              </div>
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">
                            Description
                          </label>
                          <div className="relative">
                            <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                              type="text"
                              placeholder="E.g. Dinner, Grocery..."
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              className="w-full h-12 pl-11 pr-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl font-medium outline-none text-sm transition-all"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">
                              Amount
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                                {currencySymbol}
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                readOnly={
                                  payMode === "multiple" ||
                                  splitType === "itemized"
                                }
                                value={amountDisplay}
                                onChange={(e) => setAmount(e.target.value)}
                                className={`w-full h-12 pl-9 pr-4 border-2 border-transparent rounded-2xl font-black outline-none text-sm transition-all ${
                                  payMode === "multiple" ||
                                  splitType === "itemized"
                                    ? "bg-slate-100 text-slate-400"
                                    : "bg-slate-50 focus:border-indigo-500 focus:bg-white"
                                }`}
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block">
                              Date
                            </label>
                            <input
                              type="date"
                              value={expenseDate}
                              onChange={(e) => setExpenseDate(e.target.value)}
                              className="w-full h-12 px-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white text-[11px] font-bold outline-none transition-all"
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-bold uppercase text-slate-400">
                              2. Who paid?
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setPayMode((mode) =>
                                  mode === "single" ? "multiple" : "single",
                                )
                              }
                              className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors uppercase tracking-wider"
                            >
                              {payMode === "single"
                                ? "Split Payment"
                                : "Single Payer"}
                            </button>
                          </div>
                          {payMode === "single" ? (
                            <div className="flex flex-wrap gap-2">
                              {members.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => setSinglePayer(m.id)}
                                  className={`flex items-center gap-2 p-2.5 rounded-2xl border-2 transition-all ${
                                    effectiveSinglePayer === m.id
                                      ? "bg-white border-indigo-500"
                                      : "bg-slate-50 border-transparent text-slate-500"
                                  }`}
                                >
                                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                    {getInitials(m.fullname, m.email)}
                                  </div>
                                  <span className="text-[10px] font-bold truncate max-w-[80px]">
                                    {m.id === currentUserId
                                      ? "Me"
                                      : (m.fullname?.split(" ")[0] ?? m.email)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                              {members.map((m) => (
                                <div
                                  key={m.id}
                                  className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                                      {getInitials(m.fullname, m.email)}
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-600">
                                      {m.id === currentUserId
                                        ? "Me"
                                        : (m.fullname?.split(" ")[0] ??
                                          m.email)}
                                    </span>
                                  </div>
                                  <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                      {currencySymbol}
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="w-20 h-8 pl-5 pr-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-right outline-none"
                                      value={multiplePayers[m.id] ?? ""}
                                      onChange={(e) =>
                                        handleMultiplePayerChange(
                                          m.id,
                                          e.target.value,
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: split method + member list */}
                      <div className="flex-1 min-w-0 px-8 flex flex-col pb-6 ">
                        <div className="pt-6 lg:pt-8 border-t lg:border-t-0  border-slate-100 flex flex-col flex-1 min-h-0">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-[10px] font-bold uppercase text-slate-400">
                              3. Split method
                            </label>
                            <div
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${
                                isBalanced
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {isBalanced ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <AlertCircle className="w-3 h-3 animate-pulse" />
                              )}
                              <span>
                                {isBalanced
                                  ? "Balanced"
                                  : `${currencySymbol}${remainingSplit.toFixed(2)} left`}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-4">
                            {EXPENSE_FORM_SPLIT_METHODS.map(({ id, label }) => {
                              const Icon = SPLIT_METHOD_ICONS[id];
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => setSplitType(id)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border-2 transition-all ${
                                    splitType === id
                                      ? "bg-slate-900 border-slate-900 text-white"
                                      : "bg-white border-slate-100 text-slate-500"
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                  <span className="text-[10px] font-black uppercase">
                                    {label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                          <div className="space-y-2 pr-1 mt-4">
                            {splitType === "itemized" ? (
                              <div className="space-y-4">
                                {items.map((item, idx) => (
                                  <div
                                    key={item.id}
                                    className="bg-white p-4 rounded-2xl border-2 border-slate-100"
                                  >
                                    <div className="flex gap-3 mb-3">
                                      <input
                                        type="text"
                                        placeholder="e.g. Pasta, Wine"
                                        value={item.name}
                                        onChange={(e) =>
                                          updateItem(idx, {
                                            name: e.target.value,
                                          })
                                        }
                                        className="flex-1 h-10 px-3 bg-slate-50 rounded-xl text-sm font-bold outline-none border border-transparent focus:border-indigo-200"
                                      />
                                      <div className="relative w-24">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                          {currencySymbol}
                                        </span>
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          className="w-full h-10 pl-5 pr-2 bg-slate-50 rounded-xl text-right text-sm font-black outline-none"
                                          value={item.amount || ""}
                                          onChange={(e) =>
                                            updateItem(idx, {
                                              amount:
                                                parseFloat(e.target.value) || 0,
                                            })
                                          }
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeItem(idx)}
                                        className="p-2 text-slate-300 hover:text-red-500 rounded-lg"
                                        aria-label="Remove item"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {members.map((m) => {
                                        const active = item.assignedTo.includes(
                                          m.id,
                                        );
                                        return (
                                          <button
                                            key={m.id}
                                            type="button"
                                            onClick={() =>
                                              toggleItemAssignee(idx, m.id)
                                            }
                                            className={`px-2.5 py-1 rounded-lg text-[9px] font-bold border transition-all ${
                                              active
                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                : "bg-slate-50 border-transparent text-slate-400"
                                            }`}
                                          >
                                            {m.id === currentUserId
                                              ? "Me"
                                              : (m.fullname?.split(" ")[0] ??
                                                m.email)}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={addItemizedItem}
                                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold text-[10px] uppercase hover:text-indigo-500 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add line item
                                </button>
                              </div>
                            ) : splitType === "reimbursement" ? (
                              <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4">
                                <p className="text-[10px] font-bold uppercase text-slate-400 text-center">
                                  Who are you reimbursing the full amount to?
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {members.map((m) => (
                                    <button
                                      key={m.id}
                                      type="button"
                                      onClick={() =>
                                        setReimbursementTarget(m.id)
                                      }
                                      className={`p-4 rounded-2xl border-2 transition-all font-bold text-xs ${
                                        reimbursementTarget === m.id
                                          ? "border-indigo-500 bg-indigo-50/50 text-indigo-700"
                                          : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 justify-center">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                          {getInitials(m.fullname, m.email)}
                                        </div>
                                        {m.id === currentUserId
                                          ? "Me"
                                          : (m.fullname ?? m.email)}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              members.map((m) => {
                                const isSelected = selectedMembers.has(m.id);
                                const data = memberSplits[m.id];
                                return (
                                  <div
                                    key={m.id}
                                    className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                                      isSelected
                                        ? "bg-white border-slate-200"
                                        : "opacity-50 bg-slate-50 border-transparent"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => toggleMember(m.id)}
                                      className="flex items-center gap-3 min-w-0"
                                    >
                                      <div
                                        className={`w-5 h-5 rounded-lg flex items-center justify-center border-2 shrink-0 transition-all ${
                                          isSelected
                                            ? "bg-indigo-600 border-indigo-600 text-white"
                                            : "bg-white border-slate-200"
                                        }`}
                                      >
                                        {isSelected && (
                                          <Check className="w-3 h-3" />
                                        )}
                                      </div>
                                      <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                                        {getInitials(m.fullname, m.email)}
                                      </div>
                                      <span className="text-sm font-bold text-slate-800 truncate">
                                        {m.id === currentUserId
                                          ? "Me"
                                          : (m.fullname ?? m.email)}
                                      </span>
                                    </button>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[10px] font-black text-indigo-600">
                                        {currencySymbol}
                                        {(data?.amount_owed ?? 0).toFixed(2)}
                                      </span>
                                      {isSelected &&
                                        splitType !== "equally" && (
                                          <div className="bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-100 flex items-center gap-1">
                                            {splitType === "shares" && (
                                              <input
                                                type="number"
                                                min="0"
                                                className="w-10 bg-transparent text-right text-[11px] font-black outline-none"
                                                value={data?.shares ?? 1}
                                                onChange={(e) =>
                                                  handleSplitValueChange(
                                                    m.id,
                                                    e.target.value,
                                                    "shares",
                                                  )
                                                }
                                              />
                                            )}
                                            {splitType === "percentage" && (
                                              <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                className="w-10 bg-transparent text-right text-[11px] font-black outline-none"
                                                value={data?.percentage ?? 0}
                                                onChange={(e) =>
                                                  handleSplitValueChange(
                                                    m.id,
                                                    e.target.value,
                                                    "percentage",
                                                  )
                                                }
                                              />
                                            )}
                                            {splitType === "exact" && (
                                              <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="w-16 bg-transparent text-right text-[11px] font-black outline-none"
                                                value={data?.amount_owed ?? 0}
                                                onChange={(e) =>
                                                  handleSplitValueChange(
                                                    m.id,
                                                    e.target.value,
                                                    "amount_owed",
                                                  )
                                                }
                                              />
                                            )}
                                            {splitType === "adjustments" && (
                                              <input
                                                type="number"
                                                step="0.01"
                                                className="w-14 bg-transparent text-right text-[11px] font-black outline-none"
                                                value={data?.adjustment ?? 0}
                                                onChange={(e) =>
                                                  handleSplitValueChange(
                                                    m.id,
                                                    e.target.value,
                                                    "adjustment",
                                                  )
                                                }
                                              />
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                        <div className="flex gap-3 shrink-0">
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
                                <DollarSign className="w-4 h-4" />
                                Add Expense
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="px-8 py-4 shrink-0">
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-100">
                        <p className="text-sm font-bold text-red-700">
                          {error}
                        </p>
                      </div>
                    </div>
                  )}
                </form>
              </motion.div>
            ) : successReceiptData ? (
              <motion.div
                key="expense-success-receipt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full my-auto"
              >
                <ExpenseSuccessReceipt
                  data={successReceiptData}
                  members={members}
                  currentUserId={currentUserId}
                  currencySymbol={currencySymbol}
                  onDone={resetAndClose}
                />
              </motion.div>
            ) : (
              <motion.div
                key="expense-success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center my-auto"
              >
                <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-green-100">
                  <Check className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic mb-2">
                  Expense Added
                </h3>
                <p className="text-slate-600 text-sm font-medium mb-2">
                  {successDescription || "Expense"}
                </p>
                <p className="text-indigo-600 text-lg font-black mb-10">
                  {currencySymbol}
                  {successAmount}
                </p>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all hover:bg-indigo-600 flex items-center justify-center gap-2"
                >
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
