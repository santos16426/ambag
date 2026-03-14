"use client";

import { formatDisplayDate } from "@/lib/utils";
import { AvatarStack } from "./AvatarStack";
import { TRANSACTION_LIST_LABELS } from "../constants";
import type { TransactionItemExpense } from "../types";

interface ExpenseCardItemProps {
  item: TransactionItemExpense;
}

export function ExpenseCardItem({ item }: ExpenseCardItemProps) {
  const date = formatDisplayDate(item.expensedate ?? item.date);
  const payors = item.payors ?? [];
  const participants = item.participants ?? [];

  return (
    <div className="group bg-white border border-slate-100 rounded-[28px] p-5 mb-3 transition-all hover:border-indigo-100 flex flex-col gap-4 cursor-pointer relative">
      <div className="flex items-center justify-between gap-4 pr-8">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center justify-center min-w-[42px] h-[42px] rounded-xl bg-slate-50 group-hover:bg-indigo-50 transition-colors">
            <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-indigo-400 tracking-tighter leading-none mb-0.5">
              {date.month}
            </span>
            <span className="text-[14px] font-black text-slate-900 group-hover:text-indigo-900 leading-none">
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
        <AvatarStack users={payors} label={TRANSACTION_LIST_LABELS.paidBy} />
        <AvatarStack
          users={participants}
          label={TRANSACTION_LIST_LABELS.splitWith}
        />
      </div>
    </div>
  );
}
