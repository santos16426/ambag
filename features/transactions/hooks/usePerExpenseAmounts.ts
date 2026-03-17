import type { TransactionItemExpense } from "../types";

interface PerExpenseAmounts {
  collect: number;
  owed: number;
}

export function usePerExpenseAmounts(
  item: TransactionItemExpense,
  currentUserId?: string | null,
): PerExpenseAmounts {
  if (!currentUserId) {
    return { collect: 0, owed: 0 };
  }

  const payors = item.payors ?? [];
  const participants = item.participants ?? [];

  const paid = payors
    .filter((user) => user.id === currentUserId)
    .reduce((sum, user) => {
      const value = user.amountPaid ?? user.amountpaid ?? 0;
      return sum + Number(value || 0);
    }, 0);

  const owed = participants
    .filter((user) => user.id === currentUserId)
    .reduce((sum, user) => {
      const value = user.amountOwed ?? user.amountowed ?? 0;
      return sum + Number(value || 0);
    }, 0);

  const net = paid - owed;

  return {
    collect: net > 0 ? net : 0,
    owed: net < 0 ? -net : 0,
  };
}

