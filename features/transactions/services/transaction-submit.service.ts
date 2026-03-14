import { createClient } from "@/lib/supabase/client";
import type { ExpenseSubmitPayload } from "../hooks/useExpenseForm";

/** Raw expense row from createExpenseWithSplits RPC (Postgres returns lowercase keys). */
export interface RawExpenseRow {
  id: string;
  groupid: string;
  createdby: string;
  name: string | null;
  amount: number;
  splittype: string | null;
  notes: string | null;
  expensedate: string | null;
  receipturl: string | null;
  createdat: string;
}

/** Raw settlement row from createSettlement RPC. */
export interface RawSettlementRow {
  id: string;
  groupid: string;
  payerid: string;
  receiverid: string;
  amount: number;
  paymentmethodid: string | null;
  receipturl: string | null;
  createdat: string;
  deletedat: string | null;
}

export interface SubmitExpenseResult {
  data: { expense: RawExpenseRow; imageUpload?: unknown } | null;
  error: Error | null;
}

export interface SettlementSubmitPayload {
  groupId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  receiptUrl?: string | null;
  paymentMethodId?: string | null;
}

export interface SubmitSettlementResult {
  data: { settlement: RawSettlementRow; imageUpload?: unknown } | null;
  error: Error | null;
}

/**
 * Creates an expense plus payers and splits in one transaction via createExpenseWithSplits RPC.
 */
export async function submitExpense(
  payload: ExpenseSubmitPayload,
): Promise<SubmitExpenseResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("createexpensewithsplits", {
    payload: {
      groupId: payload.groupId,
      description: payload.description,
      amount: payload.amount,
      expenseDate: payload.expenseDate,
      splitType: payload.splitType,
      paidBy: payload.paidBy,
      participants: payload.participants,
      receiptUrl: payload.receiptUrl ?? null,
    },
  });

  if (error) {
    return { data: null, error };
  }

  const result = data as { expense?: RawExpenseRow; imageUpload?: unknown } | null;
  const expense = result?.expense ?? null;
  return {
    data: expense
      ? { expense, imageUpload: result?.imageUpload }
      : null,
    error: null,
  };
}

/**
 * Creates a settlement via createSettlement RPC.
 */
export async function submitSettlement(
  payload: SettlementSubmitPayload,
): Promise<SubmitSettlementResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("createsettlement", {
    payload: {
      groupId: payload.groupId,
      payerId: payload.payerId,
      receiverId: payload.receiverId,
      amount: payload.amount,
      receiptUrl: payload.receiptUrl ?? null,
      paymentMethodId: payload.paymentMethodId ?? null,
    },
  });

  if (error) {
    return { data: null, error };
  }

  const result = data as {
    settlement?: RawSettlementRow;
    imageUpload?: unknown;
  } | null;
  const settlement = result?.settlement ?? null;
  return {
    data: settlement
      ? { settlement, imageUpload: result?.imageUpload }
      : null,
    error: null,
  };
}
