import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

interface GroupMessageRow {
  id: string;
  groupid: string;
  senderid: string;
  body: string;
  createdat: string;
  editedat: string | null;
  deletedat: string | null;
}

interface ProfileRow {
  id: string;
  fullname: string | null;
  email: string | null;
}

interface GroupMessageReactionRow {
  id: string;
  groupmessageid: string;
  groupid: string;
  userid: string;
  emoji: string;
  createdat: string;
}

export interface GroupChatReactionSummary {
  emoji: string;
  count: number;
  hasCurrentUser: boolean;
  reactorUserIds: string[];
  reactorNames: string[];
}

export interface GroupChatMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  reactions: GroupChatReactionSummary[];
}

export interface ListGroupMessagesOptions {
  limit?: number;
  beforeCursor?: string;
}

const EMPTY_REACTIONS: GroupChatReactionSummary[] = [];

/** Realtime payloads may use lowercase or camelCase column names. */
function parseRealtimeGroupMessageRow(payloadNew: unknown): GroupMessageRow | null {
  if (!payloadNew || typeof payloadNew !== "object") return null;
  const raw = payloadNew as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id : undefined;
  const groupid =
    (typeof raw.groupid === "string" && raw.groupid) ||
    (typeof raw.groupId === "string" && raw.groupId) ||
    undefined;
  const senderid =
    (typeof raw.senderid === "string" && raw.senderid) ||
    (typeof raw.senderId === "string" && raw.senderId) ||
    undefined;
  const body = typeof raw.body === "string" ? raw.body : undefined;
  const createdat =
    (typeof raw.createdat === "string" && raw.createdat) ||
    (typeof raw.createdAt === "string" && raw.createdAt) ||
    undefined;
  const editedRaw = raw.editedat ?? raw.editedAt;
  const editedat =
    editedRaw === null || editedRaw === undefined
      ? null
      : typeof editedRaw === "string"
        ? editedRaw
        : null;
  const deletedRaw = raw.deletedat ?? raw.deletedAt;
  const deletedat =
    deletedRaw === null || deletedRaw === undefined
      ? null
      : typeof deletedRaw === "string"
        ? deletedRaw
        : null;

  if (!id || !groupid || !senderid || !createdat) return null;
  if (body === undefined) return null;

  return { id, groupid, senderid, body, createdat, editedat, deletedat };
}

function groupIdsMatch(left: string, right: string): boolean {
  return (
    left.replaceAll("-", "").toLowerCase() ===
    right.replaceAll("-", "").toLowerCase()
  );
}

function mapRowToMessage(
  row: GroupMessageRow,
  senderNamesById: Map<string, string>,
  reactions: GroupChatReactionSummary[],
): GroupChatMessage {
  return {
    id: row.id,
    groupId: row.groupid,
    senderId: row.senderid,
    senderName: senderNamesById.get(row.senderid) ?? "User",
    text: row.body,
    createdAt: row.createdat,
    reactions,
  };
}

async function getSenderNamesById(senderIds: string[]): Promise<Map<string, string>> {
  if (senderIds.length === 0) return new Map<string, string>();

  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, fullname, email")
    .in("id", senderIds);

  if (error || !data) return new Map<string, string>();

  const senderNames = new Map<string, string>();
  for (const profile of data as ProfileRow[]) {
    const resolvedName = profile.fullname?.trim() || profile.email?.trim() || "User";
    senderNames.set(profile.id, resolvedName);
  }
  return senderNames;
}

/** Loads profile names for reactor IDs and groups reaction rows into summaries. */
async function aggregateReactionsForMessages(
  reactionRows: GroupMessageReactionRow[],
  currentUserId: string | null,
): Promise<Map<string, GroupChatReactionSummary[]>> {
  const byMessage = new Map<string, GroupMessageReactionRow[]>();
  for (const row of reactionRows) {
    const list = byMessage.get(row.groupmessageid) ?? [];
    list.push(row);
    byMessage.set(row.groupmessageid, list);
  }

  const allUserIds = Array.from(new Set(reactionRows.map((r) => r.userid)));
  const namesById = await getSenderNamesById(allUserIds);

  const result = new Map<string, GroupChatReactionSummary[]>();

  for (const [messageId, rowsForMessage] of byMessage) {
    const emojiToUserIds = new Map<string, string[]>();
    for (const r of rowsForMessage) {
      const list = emojiToUserIds.get(r.emoji) ?? [];
      list.push(r.userid);
      emojiToUserIds.set(r.emoji, list);
    }

    const summaries: GroupChatReactionSummary[] = [];
    for (const [emoji, userIds] of emojiToUserIds) {
      const uniqueIds = Array.from(new Set(userIds));
      const sortedIds = [...uniqueIds].sort();
      const reactorNames = sortedIds.map(
        (id) => namesById.get(id) ?? "Unknown member",
      );
      summaries.push({
        emoji,
        count: uniqueIds.length,
        hasCurrentUser:
          currentUserId !== null && uniqueIds.includes(currentUserId),
        reactorUserIds: sortedIds,
        reactorNames,
      });
    }
    summaries.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.emoji.localeCompare(b.emoji);
    });
    result.set(messageId, summaries);
  }

  return result;
}

export async function listReactionsForMessageIds(
  messageIds: string[],
  currentUserId: string | null,
): Promise<{ data: Map<string, GroupChatReactionSummary[]> | null; error: Error | null }> {
  if (messageIds.length === 0) {
    return { data: new Map(), error: null };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("groupmessagereactions")
    .select("id, groupmessageid, groupid, userid, emoji, createdat")
    .in("groupmessageid", messageIds);

  if (error) return { data: null, error: new Error(error.message) };

  const rows = (data as GroupMessageReactionRow[]) ?? [];
  const aggregated = await aggregateReactionsForMessages(rows, currentUserId);
  return { data: aggregated, error: null };
}

export async function toggleGroupMessageReaction(
  groupId: string,
  messageId: string,
  emoji: string,
): Promise<{ data: GroupChatReactionSummary[] | null; error: Error | null }> {
  const supabase = createClient();
  const trimmedEmoji = emoji.trim();
  if (!trimmedEmoji) {
    return { data: null, error: new Error("Emoji cannot be empty") };
  }
  if (trimmedEmoji.length > 32) {
    return { data: null, error: new Error("Emoji is too long") };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) {
    return { data: null, error: new Error("You must be logged in to react") };
  }

  const { data: existing, error: selectError } = await supabase
    .from("groupmessagereactions")
    .select("id")
    .eq("groupmessageid", messageId)
    .eq("userid", user.id)
    .eq("emoji", trimmedEmoji)
    .maybeSingle();

  if (selectError) {
    return { data: null, error: new Error(selectError.message) };
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("groupmessagereactions")
      .delete()
      .eq("id", (existing as { id: string }).id);

    if (deleteError) {
      return { data: null, error: new Error(deleteError.message) };
    }
  } else {
    const { error: insertError } = await supabase.from("groupmessagereactions").insert({
      groupid: groupId,
      groupmessageid: messageId,
      userid: user.id,
      emoji: trimmedEmoji,
    });

    if (insertError) {
      return { data: null, error: new Error(insertError.message) };
    }
  }

  const { data: next, error: listError } = await listReactionsForMessageIds(
    [messageId],
    user.id,
  );
  if (listError || !next) {
    return { data: null, error: listError ?? new Error("Failed to load reactions") };
  }

  return { data: next.get(messageId) ?? EMPTY_REACTIONS, error: null };
}

export async function listGroupMessages(
  groupId: string,
  options?: ListGroupMessagesOptions,
): Promise<{ data: GroupChatMessage[] | null; error: Error | null }> {
  const supabase = createClient();
  const limit = options?.limit ?? 100;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  let query = supabase
    .from("groupmessages")
    .select("id, groupid, senderid, body, createdat, editedat, deletedat")
    .eq("groupid", groupId)
    .is("deletedat", null)
    .order("createdat", { ascending: false })
    .limit(limit);

  if (options?.beforeCursor) {
    query = query.lt("createdat", options.beforeCursor);
  }

  const { data, error } = await query;
  if (error) return { data: null, error: new Error(error.message) };

  const rows = (data as GroupMessageRow[]) ?? [];
  const senderIds = Array.from(new Set(rows.map((row) => row.senderid)));
  const senderNamesById = await getSenderNamesById(senderIds);

  const messageIds = rows.map((r) => r.id);
  const { data: reactionsByMessage, error: reactionsError } =
    await listReactionsForMessageIds(messageIds, currentUserId);
  if (reactionsError || !reactionsByMessage) {
    return { data: null, error: reactionsError ?? new Error("Failed to load reactions") };
  }

  const messages = rows
    .map((row) =>
      mapRowToMessage(
        row,
        senderNamesById,
        reactionsByMessage.get(row.id) ?? EMPTY_REACTIONS,
      ),
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return { data: messages, error: null };
}

export async function sendGroupMessage(
  groupId: string,
  text: string,
): Promise<{ data: GroupChatMessage | null; error: Error | null }> {
  const supabase = createClient();
  const trimmed = text.trim();

  if (!trimmed) return { data: null, error: new Error("Message cannot be empty") };
  if (trimmed.length > 2000) {
    return { data: null, error: new Error("Message is too long") };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return { data: null, error: new Error("You must be logged in to chat") };

  const { data, error } = await supabase
    .from("groupmessages")
    .insert({
      groupid: groupId,
      senderid: user.id,
      body: trimmed,
    })
    .select("id, groupid, senderid, body, createdat, editedat, deletedat")
    .single();

  if (error || !data) {
    return { data: null, error: new Error(error?.message ?? "Failed to send message") };
  }

  const senderNamesById = await getSenderNamesById([user.id]);
  return {
    data: mapRowToMessage(data as GroupMessageRow, senderNamesById, EMPTY_REACTIONS),
    error: null,
  };
}

export function subscribeToGroupMessages(
  groupId: string,
  onInsert: (message: GroupChatMessage) => void,
): RealtimeChannel {
  const supabase = createClient();
  const channel = supabase
    .channel(`group-chat:${groupId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "groupmessages",
        // No server-side filter: `groupmessagereactions` uses REPLICA IDENTITY FULL but
        // `groupmessages` historically did not, which breaks filtered postgres_changes for
        // INSERTs. RLS still limits events to rows the user can SELECT; we filter to this
        // thread in the handler. After DB has REPLICA IDENTITY FULL on groupmessages, you
        // could add filter: `groupid=eq.${groupId}` again to reduce traffic.
      },
      async (payload) => {
        try {
          const row = parseRealtimeGroupMessageRow(payload.new);
          if (!row || row.deletedat || !groupIdsMatch(row.groupid, groupId)) return;
          const senderNamesById = await getSenderNamesById([row.senderid]);
          onInsert(mapRowToMessage(row, senderNamesById, EMPTY_REACTIONS));
        } catch (cause) {
          console.warn("[group-chat] realtime INSERT handler failed:", cause);
        }
      },
    )
    .subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("[group-chat] messages channel:", status, err);
      }
    });

  return channel;
}

export function subscribeToGroupMessageReactions(
  groupId: string,
  onChange: (messageId: string | null) => void,
): RealtimeChannel {
  const supabase = createClient();
  const channel = supabase
    .channel(`group-chat-reactions:${groupId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "groupmessagereactions",
        filter: `groupid=eq.${groupId}`,
      },
      (payload) => {
        const row = payload.new as GroupMessageReactionRow;
        if (row?.groupmessageid) onChange(row.groupmessageid);
      },
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "groupmessagereactions",
      },
      (payload) => {
        const row = payload.old as Partial<GroupMessageReactionRow>;
        const messageId = row?.groupmessageid;
        if (row?.groupid && row.groupid !== groupId) return;
        onChange(messageId ?? null);
      },
    )
    .subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.warn("[group-chat] reactions channel:", status, err);
      }
    });

  return channel;
}

export function unsubscribeFromGroupMessages(channel: RealtimeChannel): void {
  const supabase = createClient();
  void supabase.removeChannel(channel);
}

export function unsubscribeFromGroupMessageReactions(channel: RealtimeChannel): void {
  const supabase = createClient();
  void supabase.removeChannel(channel);
}
