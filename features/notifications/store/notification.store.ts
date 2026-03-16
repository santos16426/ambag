"use client";

import { create } from "zustand";

import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  removeNotification,
} from "../services/notification.service";
import type { Notification } from "../types";

interface NotificationState {
  items: Notification[];
  loading: boolean;
  countLoading: boolean;
  error: string | null;
  initialized: boolean;
  unreadCount: number;
  fetchNotifications: (options?: { force?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  items: [],
  loading: false,
  countLoading: false,
  error: null,
  initialized: false,
  unreadCount: 0,

  fetchNotifications: async (options) => {
    const state = get();
    if (state.loading) return;
    if (!options?.force && state.initialized) return;

    set({ loading: true, error: null });

    const { data, error } = await fetchNotifications();

    if (error) {
      set({ loading: false, error: error.message });
      return;
    }

    const items = data ?? [];
    set({
      loading: false,
      initialized: true,
      items,
      unreadCount: items.filter((n) => !n.isread).length,
    });
  },

  fetchUnreadCount: async () => {
    if (get().countLoading) return;
    set({ countLoading: true });
    const { count } = await fetchUnreadCount();
    set({ unreadCount: count, countLoading: false });
  },

  markAsRead: async (id) => {
    set((state) => {
      const items = state.items.map((n) =>
        n.id === id ? { ...n, isread: true } : n,
      );
      return { items, unreadCount: items.filter((n) => !n.isread).length };
    });
    await markNotificationRead(id);
  },

  markAllAsRead: async () => {
    const hasUnread = get().items.some((n) => !n.isread);
    if (!hasUnread) return;
    set((state) => {
      const items = state.items.map((n) => ({ ...n, isread: true }));
      return { items, unreadCount: 0 };
    });
    await markAllNotificationsRead();
  },

  remove: async (id) => {
    set((state) => {
      const items = state.items.filter((n) => n.id !== id);
      return { items, unreadCount: items.filter((n) => !n.isread).length };
    });
    await removeNotification(id);
  },

  reset: () =>
    set({
      items: [],
      loading: false,
      countLoading: false,
      error: null,
      initialized: false,
      unreadCount: 0,
    }),
}));
