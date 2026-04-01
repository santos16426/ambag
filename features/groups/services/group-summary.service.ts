import { createClient } from "@/lib/supabase/client";

import type { GroupSummaryBreakdown, GroupSummaryData } from "../types";

export interface GetGroupSummaryResult {
  data: GroupSummaryData | null;
  error: Error | null;
}

/** Raw shape returned by the getGroupSummaryForUser RPC (camelCase keys). */
interface RpcGroupSummaryMember {
  userId: string;
  amount: number;
  userDetails: {
    id: string;
    fullName: string | null;
    avatarUrl: string | null;
    email?: string | null;
  };
}

interface RpcGroupSummaryPayload {
  totalGroupExpenses: number;
  totalSettlements: number;
  owedByMe: { total: number; members: RpcGroupSummaryMember[] };
  owedToMe: { total: number; members: RpcGroupSummaryMember[] };
}

function mapBreakdown(raw: RpcGroupSummaryPayload["owedByMe"]): GroupSummaryBreakdown {
  return {
    total: Number(raw?.total ?? 0),
    members: (raw?.members ?? []).map((m) => ({
      userId: m.userId,
      amount: Number(m.amount),
      userDetails: {
        id: m.userDetails.id,
        fullName: m.userDetails.fullName,
        avatarUrl: m.userDetails.avatarUrl,
        email: m.userDetails.email ?? null,
      },
    })),
  };
}

function mapRpcSummary(payload: RpcGroupSummaryPayload): GroupSummaryData {
  return {
    totalGroupExpenses: Number(payload.totalGroupExpenses ?? 0),
    totalSettlements: Number(payload.totalSettlements ?? 0),
    owedByMe: mapBreakdown(payload.owedByMe),
    owedToMe: mapBreakdown(payload.owedToMe),
  };
}

export async function getGroupSummary(groupId: string): Promise<GetGroupSummaryResult> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("getgroupsummaryforuser", {
    p_group_id: groupId,
  });

  if (error) return { data: null, error };

  if (!data || typeof data !== "object") {
    return { data: null, error: new Error("Invalid response from getGroupSummaryForUser") };
  }

  return { data: mapRpcSummary(data as RpcGroupSummaryPayload), error: null };
}
