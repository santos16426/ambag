"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox, Receipt, Pencil, Trash2, HandCoins, type LucideProps } from "lucide-react";
import type { ForwardRefExoticComponent, RefAttributes } from "react";

import { useNotificationStore } from "../store/notification.store";
import { NOTIFICATION_TYPE_LABELS } from "../types";
import type { Notification } from "../types";

function getRelativeTime(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function getNotificationUrl(n: Notification): string | null {
  if (!n.groupid) return null;
  const base = `/dashboard/${n.groupid}`;
  switch (n.type) {
    case "payment_reminder":
      // Always open the settlement form. Include the receiver UUID when available.
      return `${base}?settle=${n.referenceid ?? "open"}`;
    case "expense_created":
    case "expense_updated":
      return n.referenceid ? `${base}?highlight=${n.referenceid}` : base;
    case "expense_deleted":
    case "settlement":
    default:
      return base;
  }
}

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>;

const TYPE_ICONS: Record<string, LucideIcon> = {
  expense_created: Receipt,
  expense_updated: Pencil,
  expense_deleted: Trash2,
  settlement: HandCoins,
  payment_reminder: Bell,
};

function NotificationIcon({ type, isread }: { type: string | null; isread: boolean }) {
  const Icon: LucideIcon = (type ? TYPE_ICONS[type] : null) ?? Inbox;
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        isread ? "bg-muted text-muted-foreground" : "bg-blue-100 text-blue-600"
      }`}
    >
      <Icon size={18} />
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onNavigate: (url: string) => void;
}

function NotificationItem({ notification, onNavigate }: NotificationItemProps) {
  const { markAsRead, remove } = useNotificationStore();
  const title =
    (notification.type && NOTIFICATION_TYPE_LABELS[notification.type]) ??
    "Notification";
  const url = getNotificationUrl(notification);

  function handleClick() {
    if (!notification.isread) markAsRead(notification.id);
    if (url) onNavigate(url);
  }

  return (
    <div
      onClick={handleClick}
      className={`p-4 flex gap-3 hover:bg-muted/50 transition-colors cursor-pointer relative group ${
        !notification.isread ? "bg-blue-50/30" : ""
      }`}
    >
      <NotificationIcon type={notification.type} isread={notification.isread} />

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <p className="text-sm font-bold text-foreground truncate">{title}</p>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {getRelativeTime(notification.createdat)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 font-medium">
          {notification.message ?? "—"}
        </p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          remove(notification.id);
        }}
        className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted text-muted-foreground"
        aria-label="Dismiss notification"
      >
        ×
      </button>

      {!notification.isread && (
        <div className="absolute right-3 bottom-3 w-1.5 h-1.5 bg-blue-500 rounded-full group-hover:hidden" />
      )}
    </div>
  );
}

interface NotificationPanelProps {
  onClose?: () => void;
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const router = useRouter();
  const { items, loading, fetchNotifications, markAllAsRead } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function handleNavigate(url: string) {
    router.push(url);
    onClose?.();
  }

  return (
    <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-card rounded-[24px] shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-100">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
          Notifications
        </h3>
        {items.some((n) => !n.isread) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAllAsRead();
            }}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase"
          >
            <CheckCheck size={12} /> Mark all read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-2 bg-muted/50 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="divide-y divide-border">
            {items.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onNavigate={handleNavigate}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 px-6 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-bold text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">
              No new notifications at the moment.
            </p>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            fetchNotifications({ force: true });
          }}
          className="w-full py-3 bg-muted/30 text-[10px] font-bold text-muted-foreground hover:bg-muted transition-colors border-t border-border uppercase tracking-widest"
        >
          Refresh
        </button>
      )}
    </div>
  );
}
