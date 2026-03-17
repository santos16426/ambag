import { createClient } from "@/lib/supabase/client";

import type {
  TransactionItem,
  TransactionItemExpense,
  TransactionItemSettlement,
  TransactionUser,
} from "../types";

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
    };
    return exp;
  }

  const set: TransactionItemSettlement = {
    ...base,
    type: "settlement",
    payerid: item.payerid ?? "",
    receiverid: item.receiverid ?? "",
    payer: item.payer ?? null,
    receiver: item.receiver ?? null,
  };
  return set;
}

/**
 * Fetches the full group transactions feed (expenses + settlements, date-sorted).
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
    ? raw.map((item) =>
        mapFeedItem({
          ...item,
          createdby: mapUserAvatar(item.createdby ?? null) ?? null,
          payors: mapUserArray(item.payors ?? null),
          participants: mapUserArray(item.participants ?? null),
          payer: mapUserAvatar(item.payer ?? null),
          receiver: mapUserAvatar(item.receiver ?? null),
        }),
      )
    : [];

  return { items, error: null };
}
