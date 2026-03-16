import { createClient } from "@/lib/supabase/client";

import type { Notification } from "../types";

export async function fetchNotifications(): Promise<{
  data: Notification[] | null;
  error: Error | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("createdat", { ascending: false })
    .limit(50);

  if (error) return { data: null, error: new Error(error.message) };
  return { data: data as Notification[], error: null };
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ isread: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ isread: true })
    .eq("isread", false);
  if (error) throw new Error(error.message);
}

export async function fetchUnreadCount(): Promise<{
  count: number;
  error: Error | null;
}> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("getunreadnotificationcount");
  if (error) return { count: 0, error: new Error(error.message) };
  return { count: data ?? 0, error: null };
}

export interface SendPaymentReminderPayload {
  toUserId: string;
  fromUserId: string;
  groupId: string;
  amount: number;
  senderName: string;
}

export async function sendPaymentReminder(
  payload: SendPaymentReminderPayload,
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const amountFormatted = payload.amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const { error } = await supabase.rpc("createnotificationrpc", {
    payload: {
      userId: payload.toUserId,
      groupId: payload.groupId,
      type: "payment_reminder",
      referenceId: payload.fromUserId,
      message: `${payload.senderName} is reminding you to settle your balance of $${amountFormatted}.`,
    },
  });
  if (error) return { error: new Error(error.message) };
  return { error: null };
}

export async function removeNotification(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}
