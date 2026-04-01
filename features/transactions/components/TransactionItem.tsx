"use client";

import type { TransactionItem } from "../types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function displayName(user: { name: string | null; email?: string | null } | null): string {
  if (!user) return "Unknown";
  return user.name?.trim() || user.email?.trim() || "Unknown";
}

interface TransactionItemProps {
  item: TransactionItem;
}

export function TransactionItemRow({ item }: TransactionItemProps) {
  const amountFormatted = `₱${Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (item.type === "expense") {
    const payorNames = item.payors.length
      ? item.payors.map((p) => displayName(p)).join(", ")
      : displayName(item.createdby);
    return (
      <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            Expense
          </span>
          <span className="font-semibold text-slate-900">{amountFormatted}</span>
        </div>
        {item.name && (
          <p className="text-sm font-medium text-slate-800">{item.name}</p>
        )}
        <p className="text-xs text-slate-500">
          Paid by {payorNames}
          {item.participants.length > 0 && (
            <> · Split with {item.participants.map((p) => displayName(p)).join(", ")}</>
          )}
        </p>
        <p className="text-xs text-slate-400">{formatDate(item.expensedate ?? item.date)}</p>
      </div>
    );
  }

  const payerName = displayName(item.payer);
  const receiverName = displayName(item.receiver);
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
          Settlement
        </span>
        <span className="font-semibold text-slate-900">{amountFormatted}</span>
      </div>
      <p className="text-sm text-slate-700">
        {payerName} → {receiverName}
      </p>
      <p className="text-xs text-slate-400">{formatDate(item.date)}</p>
    </div>
  );
}
