"use client";

import { Loader2, Plus, Receipt } from "lucide-react";
import { useTransactionList } from "../hooks/useTransactionList";
import {
  TRANSACTION_LIST_LABELS,
  TRANSACTION_LIST_PAGE_SIZE,
} from "../constants";
import { TransactionListStatus } from "./TransactionListStatus";
import { TransactionListItems } from "./TransactionListItems";
import type { TransactionItemExpense, TransactionItemSettlement } from "../types";

interface TransactionListProps {
  groupid: string;
  pagesize?: number;
  currentUserId?: string | null;
  isArchived?: boolean;
  highlightId?: string | null;
  onOpenExpense?: () => void;
  onOpenSettlement?: () => void;
  onEditExpense?: (item: TransactionItemExpense) => void;
  onDeleteExpense?: (item: TransactionItemExpense) => void;
  onEditSettlement?: (item: TransactionItemSettlement) => void;
  onDeleteSettlement?: (item: TransactionItemSettlement) => void;
}

export function TransactionList({
  groupid,
  pagesize = TRANSACTION_LIST_PAGE_SIZE,
  currentUserId = null,
  isArchived = false,
  highlightId,
  onOpenExpense,
  onOpenSettlement,
  onEditExpense,
  onDeleteExpense,
  onEditSettlement,
  onDeleteSettlement,
}: TransactionListProps) {
  const { items, total, hasmore, loadmore, loading, error, refetch } =
    useTransactionList(groupid, { pagesize });

  if (loading && items.length === 0) {
    return <TransactionListStatus status="loading" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1">
              <Receipt className="w-3 h-3" />
              {TRANSACTION_LIST_LABELS.activity}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isArchived && onOpenExpense && (
              <button
                type="button"
                onClick={onOpenExpense}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <Plus className="w-3 h-3" />
                {TRANSACTION_LIST_LABELS.addExpense}
              </button>
            )}
            {!isArchived && onOpenSettlement && (
              <button
                type="button"
                onClick={onOpenSettlement}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em]"
              >
                <Plus className="w-3 h-3" />
                {TRANSACTION_LIST_LABELS.settleUp}
              </button>
            )}
          </div>
        </div>

        {error ? (
          <TransactionListStatus
            status="error"
            errormessage={error}
            onretry={() => refetch()}
          />
        ) : items.length === 0 ? (
          <TransactionListStatus
            status="empty"
            onopenexpense={isArchived ? undefined : onOpenExpense}
            onopensettlement={isArchived ? undefined : onOpenSettlement}
          />
        ) : (
          <>
            <TransactionListItems
              items={items}
              currentUserId={currentUserId}
              highlightId={highlightId}
              onEditExpense={isArchived ? undefined : onEditExpense}
              onDeleteExpense={isArchived ? undefined : onDeleteExpense}
              onEditSettlement={isArchived ? undefined : onEditSettlement}
              onDeleteSettlement={isArchived ? undefined : onDeleteSettlement}
            />
            {hasmore && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={loadmore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    `Load more (${items.length} of ${total})`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
