import type { SplitType } from "../types/expense-form";

export const EXPENSE_FORM_CURRENCY = {
  code: "PHP",
  symbol: "₱",
} as const;

export const EXPENSE_FORM_SPLIT_METHODS: ReadonlyArray<{
  id: SplitType;
  label: string;
  description: string;
  example: string;
}> = [
  {
    id: "equally",
    label: "Equally",
    description:
      "Divide the total evenly across everyone you include in the split.",
    example: "₱300 for 3 people → ₱100 each",
  },
  {
    id: "shares",
    label: "Shares",
    description:
      "Use weights (e.g. 2 vs 1) so people who should pay more get a larger slice.",
    example: "Alex 2 shares, Blake 1 → 2/3 vs 1/3 of the bill",
  },
  {
    id: "percentage",
    label: "Percent",
    description:
      "Set how much of the bill each person owes; percentages should add up to 100%.",
    example: "Anna 60%, Ben 40% of the total",
  },
  {
    id: "exact",
    label: "Exact",
    description: "Type the precise amount each person owes, down to the cent. Should add up to the total amount.",
    example: "Total amount is ₱300. Kay owes ₱120, Lee owes ₱180",
  },
  {
    id: "adjustments",
    label: "Adjust",
    description:
      "Start from an even split, then add or subtract fixed amounts per person.",
    example: "Start even, then +₱50 for the one who ordered extra",
  },
  {
    id: "itemized",
    label: "Itemized",
    description:
      "List separate charges and tap who shared each line—great for shared meals.",
    example: "Wine ₱400 → split 2 ways; rice → everyone",
  },
  {
    id: "reimbursement",
    label: "Reimburse",
    description:
      "Record money owed back to the payer and assign that cost to specific people.",
    example: "You paid; roommates each owe you their share",
  },
] as const;

export const EXPENSE_FORM_BALANCE_THRESHOLD = 0.01;
