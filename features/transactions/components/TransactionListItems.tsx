"use client";

import type { TransactionItem, TransactionItemExpense } from "../types";
import { useIsInvolved } from "../hooks/useIsInvolved";
import { ExpenseCardItem } from "./ExpenseCardItem";
import { SettlementCardItem } from "./SettlementCardItem";

interface TransactionListItemsProps {
  items: TransactionItem[];
  currentUserId?: string | null;
  highlightId?: string | null;
  onEditExpense?: (item: TransactionItemExpense) => void;
  onDeleteExpense?: (item: TransactionItemExpense) => void;
}

export function TransactionListItems({
  items,
  currentUserId,
  highlightId,
  onEditExpense,
  onDeleteExpense,
}: TransactionListItemsProps) {
  const { isInvolved } = useIsInvolved();

  return (
    <div className="mt-4">
      {items.map((item) => {
        const involved = isInvolved(item);

        if (item.type === "expense") {
          return (
            <div key={`expense-${item.id}`} className="w-full text-left">
              <ExpenseCardItem
                item={item}
                isinvolved={involved}
                isHighlighted={item.id === highlightId}
                onClick={() => onEditExpense?.(item)}
                onDelete={
                  onDeleteExpense ? () => onDeleteExpense(item) : undefined
                }
              />
            </div>
          );
        }
        return (
          <div key={`settlement-${item.id}`} className="w-full text-left">
            <SettlementCardItem
              item={item}
              currentUserId={currentUserId}
              isinvolved={involved}
            />
          </div>
        );
      })}
    </div>
  );
}
