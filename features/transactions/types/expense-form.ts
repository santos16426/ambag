export type SplitType =
  | "equally"
  | "shares"
  | "percentage"
  | "exact"
  | "adjustments"
  | "itemized"
  | "reimbursement";

export interface ItemizedItem {
  id: string;
  name: string;
  amount: number;
  assignedTo: string[];
}

export interface ExpenseFormMember {
  id: string;
  fullname: string | null;
  email: string;
}

export interface MemberSplitState {
  user_id: string;
  amount_owed: number;
  percentage: number;
  shares: number;
  adjustment: number;
}

import type { TransactionItemExpense } from "./index";

export interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  members: ExpenseFormMember[];
  currentUserId?: string | null;
  mode?: "create" | "edit";
  initialExpense?: TransactionItemExpense | null;
  onSuccess?: (item: TransactionItemExpense) => void;
  onDelete?: (expenseId: string) => void;
}

export type SplitValueField =
  | "shares"
  | "percentage"
  | "adjustment"
  | "amount_owed";

export interface ExpenseSuccessReceiptData {
  description: string;
  amount: number;
  expense_date: string;
  paid_by?: string;
  payments?: Record<string, number>;
  participants: Array<{ user_id: string; amount_owed: number }>;
}
