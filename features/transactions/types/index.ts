export type TransactionItemType = "expense" | "settlement";

export interface TransactionUser {
  id: string | null;
  name: string | null;
  avatar: string | null;
  email?: string | null;
  isplaceholder?: boolean | null;
  amountPaid?: number | null;
  amountpaid?: number | null;
  amountOwed?: number | null;
  amountowed?: number | null;
}

/** Common fields for both expense and settlement items. */
export interface TransactionItemBase {
  type: TransactionItemType;
  id: string;
  groupid: string;
  amount: number;
  createdat: string;
  date: string;
  receipturl: string | null;
}

export interface TransactionItemExpense extends TransactionItemBase {
  type: "expense";
  name: string | null;
  notes: string | null;
  expensedate: string | null;
  splittype: string | null;
  createdby: TransactionUser | null;
  payors: TransactionUser[];
  participants: TransactionUser[];
  payerid?: null;
  receiverid?: null;
  payer?: null;
  receiver?: null;
}

export interface TransactionItemSettlement extends TransactionItemBase {
  type: "settlement";
  name?: null;
  notes?: null;
  expensedate?: null;
  splittype?: null;
  createdby?: null;
  payors?: null;
  participants?: null;
  payerid: string | null;
  receiverid: string | null;
  payer: TransactionUser | null;
  receiver: TransactionUser | null;
}

export type TransactionItem = TransactionItemExpense | TransactionItemSettlement;

export interface TransactionListResponse {
  items: TransactionItem[];
}

export interface TransactionListPageResult {
  items: TransactionItem[];
  hasmore: boolean;
  total: number;
  error: Error | null;
}
