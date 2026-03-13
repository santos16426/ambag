"use server";

import { createClient } from "@/lib/supabase/server";

export type JoinRequestActionResult = {
  data: { success: boolean } | null;
  error: { message: string } | null;
};

export async function acceptJoinRequestAction(
  requestId: string,
): Promise<JoinRequestActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: { message: "You must be logged in" } };
  }

  const { data: request, error: requestError } = await supabase
    .from("groupjoinrequests")
    .select("id, groupid, userid, status")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    return { data: null, error: { message: "Join request not found" } };
  }

  const { data: group } = await supabase
    .from("groups")
    .select("id, createdby")
    .eq("id", request.groupid)
    .single();

  if (!group) {
    return { data: null, error: { message: "Group not found" } };
  }

  const { data: membersSummary } = await supabase
    .from("groupmembers")
    .select("role, user:profiles!groupmembers_userid_fkey ( id )")
    .eq("groupid", request.groupid)
    .eq("status", "active");

  const member = (membersSummary ?? []).find(
    (m: { role: string; user: { id: string }[] | { id: string } | null }) => {
      const userRef = Array.isArray(m.user) ? m.user[0] : m.user;
      return userRef?.id === user.id;
    },
  ) as { role: string } | undefined;

  const isAdmin = member?.role === "admin" || group.createdby === user.id;

  if (!isAdmin) {
    return {
      data: null,
      error: { message: "Only admins can accept join requests" },
    };
  }

  const { error: updateError } = await supabase
    .from("groupjoinrequests")
    .update({
      status: "approved",
      processedat: new Date().toISOString(),
      processedby: user.id,
    })
    .eq("id", requestId);

  if (updateError) {
    return {
      data: null,
      error: {
        message: updateError.message ?? "Failed to accept request",
      },
    };
  }

  return { data: { success: true }, error: null };
}

export async function rejectJoinRequestAction(
  requestId: string,
): Promise<JoinRequestActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { data: null, error: { message: "You must be logged in" } };
  }

  const { data: request, error: requestError } = await supabase
    .from("groupjoinrequests")
    .select("id, groupid")
    .eq("id", requestId)
    .single();

  if (requestError || !request) {
    return { data: null, error: { message: "Join request not found" } };
  }

  const { data: group } = await supabase
    .from("groups")
    .select("id, createdby")
    .eq("id", request.groupid)
    .single();

  if (!group) {
    return { data: null, error: { message: "Group not found" } };
  }

  const { data: membersSummary } = await supabase
    .from("groupmembers")
    .select("role, user:profiles!groupmembers_userid_fkey ( id )")
    .eq("groupid", request.groupid)
    .eq("status", "active");

  const member = (membersSummary ?? []).find(
    (m: { role: string; user: { id: string }[] | { id: string } | null }) => {
      const userRef = Array.isArray(m.user) ? m.user[0] : m.user;
      return userRef?.id === user.id;
    },
  ) as { role: string } | undefined;

  const isAdmin = member?.role === "admin" || group.createdby === user.id;

  if (!isAdmin) {
    return {
      data: null,
      error: { message: "Only admins can reject join requests" },
    };
  }

  const { error: updateError } = await supabase
    .from("groupjoinrequests")
    .update({
      status: "rejected",
      processedat: new Date().toISOString(),
      processedby: user.id,
    })
    .eq("id", requestId);

  if (updateError) {
    return {
      data: null,
      error: {
        message: updateError.message ?? "Failed to reject request",
      },
    };
  }

  return { data: { success: true }, error: null };
}

