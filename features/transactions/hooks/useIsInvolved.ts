"use client";

import { useAuthStore } from "@/features/auth/store/auth.store";
import type { TransactionItem } from "../types";

export function useIsInvolved() {
  const sessionUser = useAuthStore((s) => s.sessionUser);
  const userId = sessionUser?.id ?? null;

  function isInvolved(item: TransactionItem): boolean {
    if (!userId) return false;

    const inPayors = item.payors?.some((p) => p.id === userId) ?? false;
    const inParticipants =
      item.participants?.some((p) => p.id === userId) ?? false;
    const isPayer =
      item.payerid === userId || item.payer?.id === userId;
    const isReceiver =
      item.receiverid === userId || item.receiver?.id === userId;

    return inPayors || inParticipants || isPayer || isReceiver;
  }

  return { isInvolved };
}
