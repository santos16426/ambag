"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Smile } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { useAuthStore } from "@/features/auth/store/auth.store";

import {
  listGroupMessages,
  listReactionsForMessageIds,
  sendGroupMessage,
  subscribeToGroupMessageReactions,
  subscribeToGroupMessages,
  toggleGroupMessageReaction,
  unsubscribeFromGroupMessageReactions,
  unsubscribeFromGroupMessages,
  type GroupChatMessage,
} from "../services/group-chat.service";
import { ReactionPicker } from "./ReactionPicker";

interface GroupChatProps {
  currentUserId?: string;
  groupId?: string;
  isArchived?: boolean;
  memberNamesByUserId?: Record<string, string>;
}

interface ChatMessage extends GroupChatMessage {
  isPending?: boolean;
}

function formatTimeFromIso(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isSameCalendarDay(leftIso: string, rightIso: string): boolean {
  return new Date(leftIso).toDateString() === new Date(rightIso).toDateString();
}

function getDateLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function upsertMessageById(
  previousMessages: ChatMessage[],
  nextMessage: ChatMessage,
): ChatMessage[] {
  const index = previousMessages.findIndex(
    (message) => message.id === nextMessage.id,
  );
  if (index === -1) return [...previousMessages, nextMessage];

  const updatedMessages = [...previousMessages];
  updatedMessages[index] = nextMessage;
  return updatedMessages;
}

export default function GroupChat({
  currentUserId,
  groupId,
  isArchived = false,
  memberNamesByUserId = {},
}: GroupChatProps) {
  const profile = useAuthStore((s) => s.profile);
  const sessionUser = useAuthStore((s) => s.sessionUser);
  const viewerId = currentUserId ?? sessionUser?.id ?? "";

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<
    string | null
  >(null);
  const [showExtendedPicker, setShowExtendedPicker] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const isSendDisabled = isArchived || !newMessage.trim();

  const patchMessageReactions = useCallback(
    async (messageId: string) => {
      const uid = viewerId || null;
      const { data, error } = await listReactionsForMessageIds(
        [messageId],
        uid,
      );
      if (error || !data) return;
      const nextReactions = data.get(messageId) ?? [];
      setMessages((previous) =>
        previous.map((m) =>
          m.id === messageId ? { ...m, reactions: nextReactions } : m,
        ),
      );
    },
    [viewerId],
  );

  const refreshVisibleMessageReactions = useCallback(async () => {
    const uid = viewerId || null;
    const messageIds = messagesRef.current.map((message) => message.id);
    if (messageIds.length === 0) return;
    const { data, error } = await listReactionsForMessageIds(messageIds, uid);
    if (error || !data) return;
    setMessages((previous) =>
      previous.map((message) => ({
        ...message,
        reactions: data.get(message.id) ?? [],
      })),
    );
  }, [viewerId]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const messagesContainer = messagesContainerRef.current;
    if (!messagesContainer) return;
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!pickerRef.current?.contains(event.target as Node)) {
        setActiveReactionMessageId(null);
        setShowExtendedPicker(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const activeGroupId = groupId;
    if (!activeGroupId) return;

    let isMounted = true;
    let messageChannel: RealtimeChannel | null = null;
    let reactionChannel: RealtimeChannel | null = null;

    async function loadMessages(currentGroupId: string) {
      setIsLoading(true);
      const { data, error } = await listGroupMessages(currentGroupId);
      if (!isMounted) return;

      if (error) {
        setErrorMessage(error.message ?? "Failed to load messages");
        setIsLoading(false);
        return;
      }

      setErrorMessage(null);
      setMessages(data ?? []);
      setIsLoading(false);

      messageChannel = subscribeToGroupMessages(
        currentGroupId,
        (insertedMessage) => {
          setMessages((previousMessages) =>
            upsertMessageById(previousMessages, insertedMessage),
          );
        },
      );

      reactionChannel = subscribeToGroupMessageReactions(
        currentGroupId,
        (messageId) => {
          if (messageId) {
            void patchMessageReactions(messageId);
            return;
          }
          void refreshVisibleMessageReactions();
        },
      );
    }

    void loadMessages(activeGroupId);

    return () => {
      isMounted = false;
      if (messageChannel) unsubscribeFromGroupMessages(messageChannel);
      if (reactionChannel)
        unsubscribeFromGroupMessageReactions(reactionChannel);
    };
  }, [groupId, patchMessageReactions, refreshVisibleMessageReactions]);

  function handleSendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSendDisabled || !groupId || !viewerId) return;

    const trimmed = newMessage.trim();
    const temporaryMessageId = `temp-${Date.now()}`;

    const optimisticMessage: ChatMessage = {
      id: temporaryMessageId,
      groupId,
      senderId: viewerId,
      senderName: profile?.fullname?.trim() || "You",
      text: trimmed,
      createdAt: new Date().toISOString(),
      reactions: [],
      isPending: true,
    };

    setMessages((previousMessages) => [...previousMessages, optimisticMessage]);
    setNewMessage("");
    setErrorMessage(null);

    void (async () => {
      const { data, error } = await sendGroupMessage(groupId, trimmed);
      if (error || !data) {
        setMessages((previousMessages) =>
          previousMessages.filter(
            (message) => message.id !== temporaryMessageId,
          ),
        );
        setErrorMessage(error?.message ?? "Failed to send message");
        return;
      }

      setMessages((previousMessages) => {
        const withoutTemp = previousMessages.filter(
          (message) => message.id !== temporaryMessageId,
        );
        return upsertMessageById(withoutTemp, data);
      });
    })();
  }

  async function handleToggleReaction(messageId: string, emoji: string) {
    if (!groupId || !viewerId || isArchived) return;

    const { data, error } = await toggleGroupMessageReaction(
      groupId,
      messageId,
      emoji,
    );
    setActiveReactionMessageId(null);
    setShowExtendedPicker(false);

    if (error) {
      setErrorMessage(error.message ?? "Could not update reaction");
      return;
    }

    setErrorMessage(null);
    if (!data) return;

    setMessages((previous) =>
      previous.map((m) => (m.id === messageId ? { ...m, reactions: data } : m)),
    );
  }

  function resolveSenderName(message: ChatMessage): string {
    const memberName = memberNamesByUserId[message.senderId]?.trim();
    if (memberName) return memberName;
    if (message.senderName && message.senderName !== "User")
      return message.senderName;
    return "Unknown member";
  }

  function resolveReactorLabel(
    reaction: ChatMessage["reactions"][number],
  ): string {
    const resolvedNames = reaction.reactorUserIds.map((userId, index) => {
      const memberName = memberNamesByUserId[userId]?.trim();
      if (memberName) return memberName;
      const fallbackName = reaction.reactorNames[index]?.trim();
      if (fallbackName) return fallbackName;
      return "Member";
    });

    return resolvedNames.join(", ");
  }

  return (
    <div
      className="flex-1 min-h-112 max-h-[70vh] flex flex-col bg-slate-50/30"
      data-group-id={groupId ?? ""}
    >
      <div
        ref={messagesContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {isLoading && (
          <div className="h-full min-h-72 flex items-center justify-center">
            <p className="text-xs text-slate-400 font-medium">
              Loading chat...
            </p>
          </div>
        )}
        {errorMessage && (
          <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
        )}
        {!isLoading && !errorMessage && messages.length === 0 && (
          <div className="h-full min-h-72 flex flex-col items-center justify-center text-center px-6">
            <p className="text-sm font-semibold text-slate-600">
              No messages yet
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Start the conversation with your first message.
            </p>
          </div>
        )}
        {!isLoading &&
          errorMessage === null &&
          messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : null;
            const showDateHeader =
              previousMessage === null ||
              !isSameCalendarDay(previousMessage.createdAt, message.createdAt);
            const isCurrentUserMessage =
              viewerId !== "" && message.senderId === viewerId;
            const canReact = Boolean(
              viewerId && groupId && !isArchived && !message.isPending,
            );
            const hasReactions = message.reactions.length > 0;
            const selectedEmojis = message.reactions
              .filter((reaction) => reaction.hasCurrentUser)
              .map((reaction) => reaction.emoji);
            const pickerAlign = isCurrentUserMessage ? "right" : "left";
            const triggerSideClass = isCurrentUserMessage
              ? "-left-10"
              : "-right-10";

            return (
              <div key={message.id} className="group/message relative">
                {showDateHeader && (
                  <div className="flex items-center justify-center my-6">
                    <div className="h-px flex-1 bg-slate-200/60"></div>
                    <span className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 py-1 rounded-full border border-slate-100/50">
                      {getDateLabel(message.createdAt)}
                    </span>
                    <div className="h-px flex-1 bg-slate-200/60"></div>
                  </div>
                )}
                <div
                  className={`flex flex-col ${
                    isCurrentUserMessage ? "items-end" : "items-start"
                  }`}
                >
                  {!isCurrentUserMessage && (
                    <span className="text-[9px] font-bold text-slate-400 ml-2 mb-1 uppercase tracking-tighter">
                      {resolveSenderName(message)}
                    </span>
                  )}
                  <div
                    className={`relative max-w-[80%] ${canReact ? "pt-1" : ""}`}
                  >
                    {canReact && (
                      <div
                        className={`absolute top-0 z-10 transition-all opacity-0 group-hover/message:opacity-100 ${triggerSideClass}`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveReactionMessageId((current) =>
                              current === message.id ? null : message.id,
                            );
                            setShowExtendedPicker(false);
                          }}
                          className="p-1.5 bg-white border border-slate-100 rounded-full shadow-sm hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-colors"
                          aria-label="Add reaction"
                        >
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {activeReactionMessageId === message.id && canReact && (
                      <ReactionPicker
                        align={pickerAlign}
                        showExtended={showExtendedPicker}
                        selectedEmojis={selectedEmojis}
                        onToggleExtended={() =>
                          setShowExtendedPicker((v) => !v)
                        }
                        onSelectEmoji={(emoji) =>
                          void handleToggleReaction(message.id, emoji)
                        }
                        containerRef={pickerRef}
                      />
                    )}

                    <div
                      className={`px-4 py-2.5 w-fit rounded-2xl text-sm shadow-sm ${
                        isCurrentUserMessage
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                      }`}
                    >
                      {message.text}
                      {message.isPending && (
                        <span className="ml-2 text-[8px] opacity-80 align-middle">
                          Sending...
                        </span>
                      )}
                    </div>

                    {hasReactions && (
                      <div
                        className={`flex flex-wrap gap-1 mt-1.5 ${
                          isCurrentUserMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        {message.reactions.map((summary) => {
                          const reactorsLabel = resolveReactorLabel(summary);
                          const tooltipSideClass = isCurrentUserMessage
                            ? "right-0"
                            : "left-0";
                          const chipClass = `flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] transition-all ${
                            summary.hasCurrentUser
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-bold"
                              : "bg-white border-slate-100 text-slate-500"
                          }`;

                          if (canReact) {
                            return (
                              <div
                                key={summary.emoji}
                                className="relative group/reaction"
                              >
                                <button
                                  type="button"
                                  title={reactorsLabel}
                                  onClick={() =>
                                    void handleToggleReaction(
                                      message.id,
                                      summary.emoji,
                                    )
                                  }
                                  className={`${chipClass} cursor-pointer hover:brightness-95`}
                                >
                                  <span className="text-xs">
                                    {summary.emoji}
                                  </span>
                                  {summary.count > 1 && (
                                    <span className="text-[10px] opacity-80">
                                      {summary.count}
                                    </span>
                                  )}
                                </button>
                                <div
                                  className={`pointer-events-none absolute bottom-full mb-1 z-20 min-w-max max-w-52 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/reaction:opacity-100 ${tooltipSideClass}`}
                                >
                                  <p className="text-[9px] uppercase tracking-wide text-slate-300">
                                    Reacted by
                                  </p>
                                  <p className="leading-snug">
                                    {reactorsLabel}
                                  </p>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={summary.emoji}
                              className="relative group/reaction"
                            >
                              <span title={reactorsLabel} className={chipClass}>
                                <span className="text-xs">{summary.emoji}</span>
                                {summary.count > 1 && (
                                  <span className="text-[10px] opacity-80">
                                    {summary.count}
                                  </span>
                                )}
                              </span>
                              <div
                                className={`pointer-events-none absolute bottom-full mb-1 z-20 min-w-max max-w-52 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover/reaction:opacity-100 ${tooltipSideClass}`}
                              >
                                <p className="text-[9px] uppercase tracking-wide text-slate-300">
                                  Reacted by
                                </p>
                                <p className="leading-snug">{reactorsLabel}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-400 mt-1 px-1">
                    {formatTimeFromIso(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          {/* <button
            type="button"
            className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-50"
            disabled={isArchived}
            aria-label="Open emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button> */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder={
                isArchived ? "Group is archived" : "Type a message..."
              }
              className="w-full bg-slate-100 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none disabled:opacity-70"
              disabled={isArchived}
            />
          </div>
          <button
            type="submit"
            disabled={isSendDisabled || !viewerId}
            className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-100"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
