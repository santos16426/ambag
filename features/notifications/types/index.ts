export interface Notification {
  id: string;
  userid: string;
  groupid: string | null;
  type: string | null;
  referenceid: string | null;
  message: string | null;
  isread: boolean;
  createdat: string;
}

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  expense_created: "New Expense",
  expense_updated: "Expense Updated",
  expense_deleted: "Expense Deleted",
  settlement: "Settlement Received",
  payment_reminder: "Payment Reminder",
};
