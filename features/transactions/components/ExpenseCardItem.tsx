"use client";

import { useEffect, useRef } from "react";
import { EyeOff, Trash2 } from "lucide-react";
import { formatDisplayDate } from "@/lib/utils";
import { AvatarStack } from "./AvatarStack";
import { TRANSACTION_LIST_LABELS } from "../constants";
import type { TransactionItemExpense } from "../types";
import { usePerExpenseAmounts } from "../hooks/usePerExpenseAmounts";

interface ExpenseCardItemProps {
  item: TransactionItemExpense;
  currentUserId?: string | null;
  isinvolved: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

export function ExpenseCardItem({
  item,
  currentUserId,
  isinvolved,
  isHighlighted = false,
  onClick,
  onDelete,
}: ExpenseCardItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const date = formatDisplayDate(item.expensedate ?? item.date);
  const payors = item.payors ?? [];
  const participants = item.participants ?? [];
  const amounts = usePerExpenseAmounts(item, currentUserId);

  useEffect(() => {
    if (!isHighlighted || !ref.current) return;
    const timer = setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
    return () => clearTimeout(timer);
  }, [isHighlighted]);

  return (
    <div
      ref={ref}
      className={`overflow-hidden group bg-white border rounded-[28px] mb-3 transition-all relative w-full ${
        isHighlighted
          ? "border-indigo-300 ring-2 ring-indigo-300 ring-offset-2 shadow-lg shadow-indigo-100"
          : "border-slate-100 hover:border-indigo-100"
      }`}
    >
      {!isinvolved && (
        <div className="absolute top-0 left-0 z-10 flex items-center gap-1 px-3 py-2 rounded-tl-xl rounded-br-xl bg-slate-100 border border-slate-100">
          <EyeOff size={10} className="text-slate-400 shrink-0" />
          <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
            Not involved
          </span>
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        className={`flex flex-col gap-4 p-5 w-full text-left cursor-pointer ${!isinvolved ? "opacity-50" : ""}`}
        aria-label={`Edit ${item.name ?? "expense"}`}
      >
        <div className="flex items-center justify-between gap-4 pr-8">
          <div className="flex items-center gap-4 blur-0 group-hover:blur-none transition-all">
            <div
              className={`flex flex-col items-center justify-center min-w-[42px] h-[42px] rounded-xl transition-colors ${
                isHighlighted
                  ? "bg-indigo-50"
                  : "bg-slate-50 group-hover:bg-indigo-50"
              }`}
            >
              <span
                className={`text-[8px] font-black uppercase tracking-tighter leading-none mb-0.5 ${
                  isHighlighted
                    ? "text-indigo-400"
                    : "text-slate-400 group-hover:text-indigo-400"
                }`}
              >
                {date.month}
              </span>
              <span
                className={`text-[14px] font-black leading-none ${
                  isHighlighted
                    ? "text-indigo-900"
                    : "text-slate-900 group-hover:text-indigo-900"
                }`}
              >
                {date.day}
              </span>
            </div>
            <h3 className="text-[16px] font-bold text-slate-900 tracking-tight leading-tight truncate max-w-[140px] sm:max-w-none">
              {item.name ?? "—"}
            </h3>
          </div>

          <div className="font-black text-lg">
            ₱
            {item.amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex items-center gap-3">
            <AvatarStack
              users={payors}
              label={TRANSACTION_LIST_LABELS.paidBy}
              collect={isinvolved ? amounts.collect : null}
            />
          </div>
          <div className="flex items-center gap-3">
            <AvatarStack
              users={participants}
              label={TRANSACTION_LIST_LABELS.splitWith}
              owed={isinvolved ? amounts.owed : null}
            />
          </div>
        </div>
      </button>

      {onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${item.name ?? "expense"}`}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl text-slate-300 opacity-0 group-hover:opacity-100 hover:text-red-500! hover:bg-red-50 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
