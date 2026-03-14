"use client";

import { Coins } from "lucide-react";
import { TRANSACTION_LIST_LABELS } from "../constants";

export type TransactionListStatusType = "loading" | "error" | "empty";

interface TransactionListStatusProps {
  status: TransactionListStatusType;
  errormessage?: string;
  onretry?: () => void;
  onopenexpense?: () => void;
  onopensettlement?: () => void;
}

function TransactionListSkeleton() {
  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-5 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1 h-3 w-24 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-40 mt-2 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-28 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-8 w-24 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>

      {/* Expense-style card skeletons */}
      <div className="bg-white border border-slate-100 rounded-[28px] p-5 mb-3 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="min-w-[42px] h-[42px] rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-5 w-16 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-50">
          <div className="space-y-1">
            <div className="h-2.5 w-12 bg-slate-100 rounded animate-pulse" />
            <div className="flex -space-x-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white animate-pulse"
                />
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-2.5 w-14 bg-slate-100 rounded animate-pulse" />
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[28px] p-5 mb-3 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="min-w-[42px] h-[42px] rounded-xl bg-slate-100 animate-pulse" />
            <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="h-5 w-20 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex justify-between pt-2 border-t border-slate-50">
          <div className="h-6 w-16 bg-slate-50 rounded animate-pulse" />
          <div className="h-6 w-20 bg-slate-50 rounded animate-pulse" />
        </div>
      </div>

      {/* Settlement-style card skeleton */}
      <div className="bg-white border border-emerald-100 rounded-[32px] p-6 mb-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-16 bg-emerald-50 rounded-lg animate-pulse" />
          <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-3 w-12 bg-slate-100 rounded animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-1 flex-1">
            <div className="h-4 w-14 bg-emerald-100 rounded animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-emerald-100 animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse" />
            <div className="h-3 w-14 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionListErrorContent({
  message,
  onretry,
}: {
  message: string;
  onretry: () => void;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 flex items-center justify-between">
      <span>{message}</span>
      <button
        type="button"
        onClick={onretry}
        className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-900 underline"
      >
        {TRANSACTION_LIST_LABELS.retry}
      </button>
    </div>
  );
}

function TransactionListEmptyContent({
  onopenexpense,
}: {
  onopenexpense?: () => void;
  onopensettlement?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onopenexpense}
      className="w-full py-10 text-center cursor-pointer hover:bg-slate-50/80 rounded-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-2"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
        <Coins className="w-7 h-7 text-slate-300" />
      </div>
      <p className="text-sm font-bold text-slate-900 mb-1">
        {TRANSACTION_LIST_LABELS.noActivityYet}
      </p>
      <p className="text-xs text-slate-500">
        {TRANSACTION_LIST_LABELS.noActivityDescription}
      </p>
    </button>
  );
}

export function TransactionListStatus({
  status,
  errormessage = "",
  onretry,
  onopenexpense,
  onopensettlement,
}: TransactionListStatusProps) {
  if (status === "loading") {
    return <TransactionListSkeleton />;
  }

  if (status === "error") {
    return (
      <TransactionListErrorContent
        message={errormessage}
        onretry={onretry ?? (() => {})}
      />
    );
  }

  if (status === "empty") {
    return (
      <TransactionListEmptyContent
        onopenexpense={onopenexpense}
        onopensettlement={onopensettlement}
      />
    );
  }

  return null;
}
