import { createClient } from "@/lib/supabase/client";
import { isAbsoluteHttpUrl } from "@/lib/utils";

import type {
  ExpenseLineItem,
  TransactionItem,
  TransactionItemExpense,
  TransactionItemSettlement,
  TransactionUser,
} from "../types";

function mapRpcLineItems(raw: unknown): ExpenseLineItem[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const out: ExpenseLineItem[] = [];
  for (const el of raw) {
    if (!el || typeof el !== "object") continue;
    const o = el as Record<string, unknown>;
    const assignedRaw = o.assignedTo ?? o.assignedto;
    const assignedTo = Array.isArray(assignedRaw)
      ? assignedRaw.map((x) => String(x)).filter(Boolean)
      : [];
    let id = "";
    if (typeof o.id === "string") id = o.id;
    else if (o.id != null) id = String(o.id);
    out.push({
      id,
      name: typeof o.name === "string" ? o.name : "",
      amount: Number(o.amount) || 0,
      assignedTo,
    });
  }
  return out.length > 0 ? out : undefined;
}

export interface GetTransactionListResult {
  items: TransactionItem[];
  error: Error | null;
}

/** Raw item shape from getGroupTransactionsFeed RPC (lowercase keys). */
interface RpcFeedItem {
  type: "expense" | "settlement";
  id: string;
  groupid: string;
  amount: number;
  createdat: string;
  date: string;
  receipturl: string | null;
  name?: string | null;
  notes?: string | null;
  expensedate?: string | null;
  splittype?: string | null;
  createdby?: TransactionUser | null;
  payors?: TransactionUser[] | null;
  participants?: TransactionUser[] | null;
  payerid?: string | null;
  receiverid?: string | null;
  payer?: TransactionUser | null;
  receiver?: TransactionUser | null;
  lineitems?: unknown;
}

function mapFeedItem(item: RpcFeedItem): TransactionItem {
  const base = {
    type: item.type,
    id: item.id,
    groupid: item.groupid,
    amount: Number(item.amount),
    createdat: item.createdat,
    date: item.date,
    receipturl: item.receipturl ?? null,
  };

  if (item.type === "expense") {
    const exp: TransactionItemExpense = {
      ...base,
      type: "expense",
      name: item.name ?? null,
      notes: item.notes ?? null,
      expensedate: item.expensedate ?? null,
      splittype: item.splittype ?? null,
      createdby: item.createdby ?? null,
      payors: Array.isArray(item.payors) ? item.payors : [],
      participants: Array.isArray(item.participants) ? item.participants : [],
      lineitems: mapRpcLineItems(item.lineitems),
    };
    return exp;
  }

  const set: TransactionItemSettlement = {
    ...base,
    type: "settlement",
    payerid: item.payerid ?? null,
    receiverid: item.receiverid ?? null,
    payer: item.payer ?? null,
    receiver: item.receiver ?? null,
  };
  return set;
}

/** Newest first; tie-break on id so order is stable between expense and settlement. */
export function sortTransactionItemsByRecency(
  items: TransactionItem[],
): TransactionItem[] {
  return [...items].sort((a, b) => {
    const ta = Date.parse(a.createdat);
    const tb = Date.parse(b.createdat);
    const aTime = Number.isNaN(ta) ? 0 : ta;
    const bTime = Number.isNaN(tb) ? 0 : tb;
    if (bTime !== aTime) return bTime - aTime;
    return b.id.localeCompare(a.id);
  });
}

/**
 * Fetches the full group transactions feed (expenses + settlements, merged and sorted by createdat desc).
 * Uses getGroupTransactionsFeed RPC (returns lowercase keys).
 */
export async function getTransactionList(
  groupid: string,
): Promise<GetTransactionListResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("getgrouptransactionsfeed", {
    p_group_id: groupid,
  });

  if (error) {
    return { items: [], error };
  }

  function mapUserAvatar(
    user: TransactionUser | null | undefined,
  ): TransactionUser | null {
    if (!user?.avatar) return user ?? null;
    if (isAbsoluteHttpUrl(user.avatar)) return user;
    const { data: publicUrl } = supabase.storage
      .from("avatars")
      .getPublicUrl(user.avatar);
    return {
      ...user,
      avatar: publicUrl.publicUrl ?? user.avatar,
    };
  }

  function mapUserArray(
    users: TransactionUser[] | null | undefined,
  ): TransactionUser[] {
    if (!Array.isArray(users)) return [];
    return users.map((u) => mapUserAvatar(u) as TransactionUser);
  }

  const raw = (data as { items?: RpcFeedItem[] } | null)?.items;
  const items: TransactionItem[] = Array.isArray(raw)
    ? sortTransactionItemsByRecency(
        raw.map((item) =>
          mapFeedItem({
            ...item,
            createdby: mapUserAvatar(item.createdby ?? null) ?? null,
            payors: mapUserArray(item.payors ?? null),
            participants: mapUserArray(item.participants ?? null),
            payer: mapUserAvatar(item.payer ?? null),
            receiver: mapUserAvatar(item.receiver ?? null),
          }),
        ),
      )
    : [];

  return { items, error: null };
}
