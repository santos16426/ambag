import type { SplitType } from "../types/expense-form";

export const EXPENSE_FORM_CURRENCY = {
  code: "PHP",
  symbol: "₱",
} as const;

export const EXPENSE_FORM_SPLIT_METHODS: ReadonlyArray<{
  id: SplitType;
  label: string;
}> = [
  { id: "equally", label: "Equally" },
  { id: "shares", label: "Shares" },
  { id: "percentage", label: "Percent" },
  { id: "exact", label: "Exact" },
  { id: "adjustments", label: "Adjust" },
  { id: "itemized", label: "Itemized" },
  { id: "reimbursement", label: "Reimburse" },
] as const;

export const EXPENSE_FORM_BALANCE_THRESHOLD = 0.01;
