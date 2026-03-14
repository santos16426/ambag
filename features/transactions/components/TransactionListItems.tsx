"use client";

import type { TransactionItem } from "../types";
import { ExpenseCardItem } from "./ExpenseCardItem";
import { SettlementCardItem } from "./SettlementCardItem";

interface TransactionListItemsProps {
  items: TransactionItem[];
  currentUserId?: string | null;
}

export function TransactionListItems({
  items,
  currentUserId,
}: TransactionListItemsProps) {
  return (
    <div className="mt-4">
      {items.map((item) => {
        if (item.type === "expense") {
          return (
            <div key={`expense-${item.id}`} className="w-full text-left">
              <ExpenseCardItem item={item} />
            </div>
          );
        }
        return (
          <div key={`settlement-${item.id}`} className="w-full text-left">
            <SettlementCardItem item={item} currentUserId={currentUserId} />
          </div>
        );
      })}
    </div>
  );
}
