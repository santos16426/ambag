"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { deleteExpense } from "../services/transaction-submit.service";
import type { TransactionItemExpense } from "../types";

interface DeleteExpenseModalProps {
  expense: TransactionItemExpense | null;
  onClose: () => void;
  onSuccess: (expenseId: string) => void;
}

export function DeleteExpenseModal({
  expense,
  onClose,
  onSuccess,
}: DeleteExpenseModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOpen = expense !== null;

  async function handleConfirm() {
    if (!expense) return;
    setIsDeleting(true);
    setError(null);
    const { success, error: deleteError } = await deleteExpense(expense.id);
    setIsDeleting(false);
    if (deleteError || !success) {
      setError(deleteError?.message ?? "Failed to delete expense. Please try again.");
      return;
    }
    onSuccess(expense.id);
    onClose();
  }

  function handleClose() {
    if (isDeleting) return;
    setError(null);
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="delete-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            key="delete-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-4 flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="p-2 hover:bg-slate-50 rounded-full transition-colors disabled:opacity-40"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-2">
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">
                Delete Expense
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Are you sure you want to delete{" "}
                <span className="font-black text-slate-900">
                  {expense?.name ?? "this expense"}
                </span>
                ?
              </p>
              {expense && (
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  ₱
                  {expense.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              )}
              <p className="text-[11px] text-slate-400 font-medium pt-1">
                This action cannot be undone. All splits and balances will be
                updated.
              </p>
            </div>

            {error && (
              <div className="mx-6 mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-[11px] font-bold text-red-600">{error}</p>
              </div>
            )}

            <div className="px-6 pb-6 flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
                className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isDeleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
