"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { SUCCESS_AUTO_CLOSE_SECONDS } from "../constants/forms";
import type { ExpenseFormMember } from "../types/expense-form";
import type { ExpenseSuccessReceiptData } from "../types/expense-form";

function getDisplayName(
  userId: string,
  members: ExpenseFormMember[],
  currentUserId?: string | null,
): string {
  const member = members.find((m) => m.id === userId);
  const name =
    member?.fullname?.trim() || member?.email || (userId ? userId : "Unknown");
  if (currentUserId && userId === currentUserId) return "You";
  return name.split(" ")[0] ?? name;
}

export interface ExpenseSuccessReceiptProps {
  data: ExpenseSuccessReceiptData;
  members: ExpenseFormMember[];
  currentUserId?: string | null;
  currencySymbol: string;
  onDone: () => void;
}

export function ExpenseSuccessReceipt({
  data,
  members,
  currentUserId,
  currencySymbol,
  onDone,
}: ExpenseSuccessReceiptProps) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    const id = window.setTimeout(() => {
      onDoneRef.current();
    }, SUCCESS_AUTO_CLOSE_SECONDS * 1000);
    return () => window.clearTimeout(id);
  }, []);

  const payers =
    data.payments && Object.keys(data.payments).length > 0
      ? Object.entries(data.payments).filter(([, amt]) => amt > 0)
      : data.paid_by
        ? [[data.paid_by, data.amount] as [string, number]]
        : [];

  return (
    <div className="w-full flex flex-col items-center justify-center p-8 min-h-[600px] overflow-hidden">
      {/* The Printer Top Slot */}
      <div className="w-64 h-8 bg-slate-800 rounded-t-xl relative z-20 shadow-xl">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-slate-900 rounded-full" />
      </div>

      {/* The Receipt Animation */}
      <div className="receipt-container relative z-10">
        <div className="receipt-paper w-60 bg-white shadow-lg p-6 text-slate-800 font-mono text-[10px] relative">
          {/* Jagged Bottom Edge */}
          <div
            className="absolute -bottom-2 left-0 right-0 h-3 bg-white"
            style={{
              clipPath:
                "polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)",
            }}
          ></div>

          <div className="text-center border-b border-dashed border-slate-300 pb-4 mb-4">
            <div className="font-black text-lg mb-1 tracking-tighter italic uppercase">
              {data.description ?? "Ambag"}
            </div>
            <div>----------------------------</div>
            <div className="text-[8px] opacity-60 mt-1">
              {data.expense_date}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between font-black text-xs">
              <span className="uppercase">Total Amount:</span>
              <span>
                {currencySymbol}
                {data.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* PAID BY SECTION */}
          <div className="border-t border-dashed border-slate-300 pt-3 mb-4 space-y-1">
            <div className="font-bold text-[8px] opacity-50 uppercase mb-1">
              Paid By
            </div>
            {payers.length > 0 ? (
              payers.map(([uid, amt]) => (
                <div
                  key={uid}
                  className="flex justify-between items-center text-[9px]"
                >
                  <span className="truncate">
                    {getDisplayName(uid, members, currentUserId)}
                  </span>
                  <span className="font-medium">
                    {currencySymbol}
                    {amt.toFixed(2)}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-center text-[9px]">
                <span className="truncate">—</span>
                <span className="font-medium">
                  {currencySymbol}
                  {data.amount.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* OWED BY SECTION */}
          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1.5">
            <div className="font-bold text-[8px] opacity-50 uppercase mb-1">
              Breakdown (Owed)
            </div>
            {data.participants.map((p, i) => (
              <div
                key={`${p.user_id ?? p.email ?? "unknown"}-${i}`}
                className="flex justify-between items-center text-[9px]"
              >
                <span className="truncate max-w-[100px]">
                  {getDisplayName(
                    p.user_id ?? p.email ?? "Unknown",
                    members,
                    currentUserId,
                  )}
                </span>
                <span className="font-bold">
                  {currencySymbol}
                  {p.amount_owed.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center pt-4 border-t border-dashed border-slate-300">
            <div className="font-black text-xs mb-2 uppercase tracking-widest">
              SUCCESSFUL
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2 border border-emerald-100">
              <Check className="w-6 h-6" />
            </div>
            <div className="text-[7px] opacity-40">SPLIT SAVED TO GROUP</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="relative px-12 py-5 bg-emerald-500 rounded-full shadow-2xl transition-all active:scale-[0.98] overflow-hidden"
      >
        {/* Timer Overlay (Inside Button) */}
        <motion.div
          className="absolute inset-0 bg-emerald-500/20 origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: SUCCESS_AUTO_CLOSE_SECONDS, ease: "linear" }}
        />

        <span className="relative flex items-center gap-3 text-white font-black text-[11px] uppercase tracking-[0.4em]">
          Done
        </span>
      </button>

      <style>{`
        @keyframes print {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(0); }
        }
        .receipt-paper {
          animation: print 2.5s cubic-bezier(0.2, 0, 0.2, 1) forwards;
        }
        .receipt-container {
          height: auto;
          overflow: hidden;
          padding-bottom: 20px;
        }
      `}</style>
    </div>
  );
}
