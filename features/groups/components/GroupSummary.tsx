"use client";

import {
  BellRing,
  Check,
  ChevronRight,
  Heart,
  RotateCcw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useAuthStore } from "@/features/auth";
import { sendPaymentReminder } from "@/features/notifications";

import { GROUP_SUMMARY_CURRENCY, GROUP_SUMMARY_LABELS } from "../constants";
import { useGroupSummary } from "../hooks/useGroupSummary";

interface GroupSummarySettlePayload {
  payerId: string;
  receiverId: string;
  amount: number;
  maxAmount: number;
}

interface GroupSummaryProps {
  groupId: string;
  currentUserId?: string | null;
  onSettleWith?: (payload: GroupSummarySettlePayload) => void;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function GroupSummarySkeleton() {
  return (
    <div className="w-full font-sans antialiased">
      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-lg overflow-hidden animate-pulse">
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-200" />
              <div className="space-y-1.5">
                <div className="h-2.5 w-16 rounded bg-slate-200" />
                <div className="h-3 w-20 rounded bg-slate-100" />
              </div>
            </div>
            <div className="space-y-1.5 text-right">
              <div className="h-2 w-14 rounded bg-slate-200 ml-auto" />
              <div className="h-3 w-10 rounded bg-slate-100 ml-auto" />
            </div>
          </div>
          <div className="p-8 rounded-[2.5rem] border border-slate-100 bg-slate-50 flex flex-col items-center gap-4">
            <div className="h-2.5 w-28 rounded bg-slate-200" />
            <div className="h-12 w-48 rounded-xl bg-slate-200" />
            <div className="h-7 w-32 rounded-full bg-slate-200" />
          </div>
          <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-8 rounded-xl bg-slate-200" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 rounded bg-slate-200" />
                  <div className="h-2 w-14 rounded bg-slate-100" />
                </div>
                <div className="h-4 w-16 rounded bg-slate-200" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
            <div className="text-center space-y-1.5">
              <div className="h-2 w-20 rounded bg-slate-200 mx-auto" />
              <div className="h-4 w-16 rounded bg-slate-100 mx-auto" />
            </div>
            <div className="text-center space-y-1.5">
              <div className="h-2 w-16 rounded bg-slate-200 mx-auto" />
              <div className="h-4 w-14 rounded bg-slate-100 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GroupSummary({
  groupId,
  currentUserId,
  onSettleWith,
}: GroupSummaryProps) {
  const {
    loading,
    error,
    refetch,
    owedByMeTotal,
    owedToMeTotal,
    netBalance,
    isOverallCredit,
    activeView,
    setActiveView,
    items,
    isEmpty,
  } = useGroupSummary(groupId);

  const { profile, sessionUser } = useAuthStore();
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());

  async function handleRemind(toUserId: string, amount: number) {
    if (remindingId || remindedIds.has(toUserId)) return;
    setRemindingId(toUserId);
    const { error: reminderError } = await sendPaymentReminder({
      toUserId,
      fromUserId: sessionUser?.id ?? "",
      groupId,
      amount,
      senderName: profile?.fullname ?? "Someone",
    });
    setRemindingId(null);
    if (reminderError) {
      toast.error("Failed to send reminder. Please try again.");
      return;
    }
    setRemindedIds((prev) => new Set(prev).add(toUserId));
    toast.success("Reminder sent!");
  }

  if (loading && items.length === 0) return <GroupSummarySkeleton />;

  if (error) {
    return (
      <div className="w-full font-sans antialiased">
        <div className="bg-white p-8 flex flex-col items-center gap-4">
          <p className="text-xs font-bold text-slate-500 text-center">
            {GROUP_SUMMARY_LABELS.errorLoading}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {GROUP_SUMMARY_LABELS.retry}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-sans antialiased text-slate-900 sticky top-10">
      <div className="relative space-y-8">
        {/* Hero card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-linear-to-tr from-indigo-500/15 to-rose-500/15 blur-3xl rounded-[2.5rem] -z-10 group-hover:opacity-80 transition-opacity duration-700" />

          <div className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-[2rem] p-6 md:p-7 shadow-[0_8px_32px_rgba(15,23,42,0.06)]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1 block">
                  {GROUP_SUMMARY_LABELS.yourNetBalance}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                  <span className="opacity-30 mr-1">
                    {GROUP_SUMMARY_CURRENCY.symbol}
                  </span>
                  {formatAmount(Math.abs(netBalance))}
                </h2>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isOverallCredit
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {isOverallCredit
                  ? GROUP_SUMMARY_LABELS.collectable
                  : GROUP_SUMMARY_LABELS.outstanding}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 p-4 rounded-2xl border border-white/60">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  {GROUP_SUMMARY_LABELS.owedToMe}
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  {GROUP_SUMMARY_CURRENCY.symbol}
                  {formatAmount(owedToMeTotal)}
                </p>
              </div>
              <div className="bg-white/60 p-4 rounded-2xl border border-white/60">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  {GROUP_SUMMARY_LABELS.owedByMe}
                </p>
                <p className="text-lg font-bold text-rose-500">
                  {GROUP_SUMMARY_CURRENCY.symbol}
                  {formatAmount(owedByMeTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* View switcher */}
        <div className="flex bg-slate-200/50 p-1 rounded-2xl shadow-inner">
          {[
            { id: "all" as const, label: GROUP_SUMMARY_LABELS.tabAll },
            { id: "owed" as const, label: GROUP_SUMMARY_LABELS.tabReceive },
            { id: "owing" as const, label: GROUP_SUMMARY_LABELS.tabPay },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id)}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all rounded-[14px] ${
                activeView === tab.id
                  ? "bg-white text-slate-900 shadow-md"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Transactions
            </p>
            <p className="text-[10px] font-medium text-slate-400">
              {items.length} {GROUP_SUMMARY_LABELS.entries}
            </p>
          </div>

          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-8 text-slate-300">
              <Heart size={24} className="mb-2 opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest">
                {GROUP_SUMMARY_LABELS.allClear}
              </p>
            </div>
          )}

          {items.map((item, index: number) => {
            const isReminded = remindedIds.has(item.userId);
            const isReminding = remindingId === item.userId;

            return (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={`${item.userId}-${index}`}
                style={{ animationDelay: `${index * 40}ms` }}
                className={`animate-in fade-in slide-in-from-bottom-2 group flex items-center justify-between p-4 bg-white/60 border border-white/70 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 rounded-[1.75rem] transition-all duration-300 ${
                  item.side === "owing" ? "cursor-pointer" : "cursor-default"
                }`}
                onClick={() => {
                  if (item.side === "owing" && currentUserId && onSettleWith) {
                    onSettleWith({
                      payerId: currentUserId,
                      receiverId: item.userId,
                      amount: item.amount,
                      maxAmount: item.amount,
                    });
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-slate-100 to-white flex items-center justify-center border border-white shadow-sm group-hover:scale-105 transition-transform">
                    <span className="text-xs font-bold text-slate-700">
                      {item.userDetails.fullName
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") ?? "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {item.userDetails.fullName ?? "Unknown"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.side === "owed" ? (
                        <TrendingUp size={10} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={10} className="text-rose-500" />
                      )}
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">
                        {item.side === "owed"
                          ? GROUP_SUMMARY_LABELS.badgeSettlementPending
                          : GROUP_SUMMARY_LABELS.badgeActionRequired}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className={`text-sm font-black tracking-tight ${
                        item.side === "owed"
                          ? "text-emerald-700"
                          : "text-rose-600"
                      }`}
                    >
                      {item.side === "owed" ? "+" : "-"}{" "}
                      {GROUP_SUMMARY_CURRENCY.symbol}
                      {formatAmount(Math.abs(item.amount))}
                    </p>
                  </div>

                  {item.side === "owed" ? (
                    <button
                      type="button"
                      disabled={isReminding || isReminded}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemind(item.userId, item.amount);
                      }}
                      title={isReminded ? "Reminder sent" : "Send payment reminder"}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border shadow-sm transition-all ${
                        isReminded
                          ? "bg-emerald-50 border-emerald-100 text-emerald-500 opacity-60"
                          : isReminding
                            ? "bg-indigo-50 border-indigo-100 text-indigo-400 animate-pulse"
                            : "bg-slate-50 border-slate-100 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-500"
                      }`}
                    >
                      {isReminded ? (
                        <Check size={13} />
                      ) : (
                        <BellRing size={13} />
                      )}
                    </button>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-slate-100 shadow-sm">
                      <ChevronRight size={14} className="text-slate-400" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
