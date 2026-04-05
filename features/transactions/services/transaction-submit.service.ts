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
  payerid: string | null;
  payeremail?: string | null;
  receiverid: string | null;
  receiveremail?: string | null;
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

export interface ExpenseUpdatePayload extends ExpenseSubmitPayload {
  /** Existing expense identifier to update. */
  expenseId: string;
}

export interface SettlementSubmitPayload {
  groupId: string;
  /** UUID user id OR placeholder email (normalized later). */
  payerId: string;
  /** UUID user id OR placeholder email (normalized later). */
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
      ...(payload.itemized != null && payload.itemized.length > 0
        ? { itemized: payload.itemized }
        : {}),
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
 * Updates an existing expense (including payors and splits) in one transaction via updateExpenseWithSplits RPC.
 */
export async function updateExpense(
  payload: ExpenseUpdatePayload,
): Promise<SubmitExpenseResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("updateexpensewithsplits", {
    payload: {
      expenseId: payload.expenseId,
      groupId: payload.groupId,
      description: payload.description,
      amount: payload.amount,
      expenseDate: payload.expenseDate,
      splitType: payload.splitType,
      paidBy: payload.paidBy,
      participants: payload.participants,
      receiptUrl: payload.receiptUrl ?? null,
      ...(payload.itemized != null && payload.itemized.length > 0
        ? { itemized: payload.itemized }
        : {}),
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

export interface DeleteExpenseResult {
  success: boolean;
  error: Error | null;
}

/**
 * Soft-deletes an expense via deleteExpense RPC.
 */
export async function deleteExpense(
  expenseId: string,
): Promise<DeleteExpenseResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("deleteexpense", {
    expenseid: expenseId,
  });

  if (error) {
    return { success: false, error };
  }

  return { success: data === true, error: null };
}

export interface DeleteSettlementResult {
  success: boolean;
  error: Error | null;
}

/**
 * Hard-deletes a settlement via deleteSettlement RPC.
 */
export async function deleteSettlement(
  settlementId: string,
): Promise<DeleteSettlementResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("deletesettlement", {
    settlementid: settlementId,
  });

  if (error) {
    return { success: false, error };
  }

  return { success: data === true, error: null };
}

export interface SettlementUpdatePayload {
  settlementId: string;
  amount: number;
  paymentMethodId?: string | null;
  receiptUrl?: string | null;
}

export interface UpdateSettlementResult {
  data: RawSettlementRow | null;
  error: Error | null;
}

/**
 * Updates a settlement via updateSettlement RPC.
 */
export async function updateSettlement(
  payload: SettlementUpdatePayload,
): Promise<UpdateSettlementResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("updatesettlement", {
    settlementid: payload.settlementId,
    payload: {
      amount: payload.amount,
      paymentMethodId: payload.paymentMethodId ?? null,
      receiptUrl: payload.receiptUrl ?? null,
    },
  });

  if (error) {
    return { data: null, error };
  }

  return { data: data as RawSettlementRow, error: null };
}

/**
 * Creates a settlement via createSettlement RPC.
 */
export async function submitSettlement(
  payload: SettlementSubmitPayload,
): Promise<SubmitSettlementResult> {
  const supabase = createClient();

  const payerIsEmail = payload.payerId.includes("@");
  const receiverIsEmail = payload.receiverId.includes("@");

  const { data, error } = await supabase.rpc("createsettlement", {
    payload: {
      groupId: payload.groupId,
      payerId: payerIsEmail ? null : payload.payerId,
      payerEmail: payerIsEmail ? payload.payerId.toLowerCase().trim() : null,
      receiverId: receiverIsEmail ? null : payload.receiverId,
      receiverEmail: receiverIsEmail
        ? payload.receiverId.toLowerCase().trim()
        : null,
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
