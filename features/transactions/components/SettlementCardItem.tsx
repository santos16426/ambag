"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { formatDisplayDate } from "@/lib/utils";
import { TRANSACTION_LIST_LABELS } from "../constants";
import type { TransactionItemSettlement } from "../types";

function displayName(user: { name: string | null } | null): string {
  if (!user) return "Unknown";
  return user.name?.trim() || "Unknown";
}

interface SettlementCardItemProps {
  item: TransactionItemSettlement;
  currentUserId?: string | null;
}

export function SettlementCardItem({ item, currentUserId }: SettlementCardItemProps) {
  const date = formatDisplayDate(item.date);
  const fromName =
    item.payer?.id === currentUserId ? "You" : displayName(item.payer) || "Sender";
  const toName =
    item.receiver?.id === currentUserId
      ? "You"
      : displayName(item.receiver) || "Recipient";

  return (
    <div className="bg-white border border-emerald-100 rounded-[32px] p-6 mb-4 transition-all hover:border-emerald-200 flex flex-col gap-4 relative cursor-pointer">
      <div className="flex items-center gap-2 mb-1">
        <div className="px-2.5 py-1 bg-emerald-50 rounded-lg">
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
            {date.month} {date.day}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 size={12} className="text-emerald-500" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {TRANSACTION_LIST_LABELS.settlement}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-14 h-14 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center text-xl font-bold text-slate-600">
            {fromName.charAt(0).toUpperCase()}
          </div>
          <span className="text-[11px] font-bold text-slate-900 truncate w-full text-center">
            {fromName}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center gap-1 flex-1">
          <div className="text-[16px] font-black text-emerald-600 tracking-tight">
            ₱
            {item.amount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </div>
          <div className="relative w-full flex items-center justify-center">
            <div className="absolute w-full h-[2px] bg-emerald-100" />
            <div className="relative bg-white px-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <ArrowRight size={16} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="w-14 h-14 rounded-full bg-indigo-50 border-4 border-white flex items-center justify-center text-xl font-bold text-indigo-600">
            {toName.charAt(0).toUpperCase()}
          </div>
          <span className="text-[11px] font-bold text-slate-900 truncate w-full text-center">
            {toName}
          </span>
        </div>
      </div>
    </div>
  );
}
