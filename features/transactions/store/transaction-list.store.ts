"use client";

import { create } from "zustand";

import { getTransactionList } from "../services/transaction-list.service";
import type {
  TransactionItem,
  TransactionItemExpense,
  TransactionItemSettlement,
} from "../types";
import { TRANSACTION_LIST_PAGE_SIZE } from "../constants";

interface TransactionListState {
  groupid: string | null;
  items: TransactionItem[];
  visiblecount: number;
  pagesize: number;
  loading: boolean;
  error: string | null;
  fetchtransactionlist: (
    groupid: string,
    options?: { force?: boolean },
  ) => Promise<void>;
  loadmore: () => void;
  setpagesize: (size: number) => void;
  cleartransactionlist: () => void;
  prependExpenseItem: (item: TransactionItemExpense) => void;
  prependSettlementItem: (item: TransactionItemSettlement) => void;
  updateExpenseItem: (item: TransactionItemExpense) => void;
  removeExpenseItem: (expenseId: string) => void;
  updateSettlementItem: (item: TransactionItemSettlement) => void;
  removeSettlementItem: (settlementId: string) => void;
  revealItem: (id: string) => void;
}

export const useTransactionListStore = create<TransactionListState>()(
  (set, get) => ({
    groupid: null,
    items: [],
    visiblecount: TRANSACTION_LIST_PAGE_SIZE,
    pagesize: TRANSACTION_LIST_PAGE_SIZE,
    loading: false,
    error: null,

    fetchtransactionlist: async (groupid: string, options?: { force?: boolean }) => {
      if (!groupid) return;

      const state = get();
      if (state.loading && state.groupid === groupid) return;
      if (
        !options?.force &&
        state.groupid === groupid &&
        state.items.length >= 0
      ) {
        return;
      }

      set({
        loading: true,
        error: null,
        groupid,
        items: state.groupid === groupid ? state.items : [],
        visiblecount: state.pagesize,
      });

      const { items, error } = await getTransactionList(groupid);

      if (get().groupid !== groupid) return;

      if (error) {
        set({
          loading: false,
          error: error.message ?? "Failed to load transactions",
          items: [],
          visiblecount: state.pagesize,
        });
        return;
      }

      set({
        loading: false,
        error: null,
        items,
        visiblecount: state.pagesize,
      });
    },

    loadmore: () =>
      set((state) => ({
        visiblecount: Math.min(
          state.visiblecount + state.pagesize,
          state.items.length,
        ),
      })),

    setpagesize: (pagesize) =>
      set((state) => ({
        pagesize,
        visiblecount: pagesize,
      })),

    cleartransactionlist: () =>
      set({
        groupid: null,
        items: [],
        visiblecount: TRANSACTION_LIST_PAGE_SIZE,
        pagesize: TRANSACTION_LIST_PAGE_SIZE,
        error: null,
      }),

    prependExpenseItem: (item) =>
      set((state) => {
        if (state.groupid !== item.groupid) return state;
        return {
          items: [item, ...state.items],
        };
      }),

    prependSettlementItem: (item) =>
      set((state) => {
        if (state.groupid !== item.groupid) return state;
        return {
          items: [item, ...state.items],
        };
      }),

    updateExpenseItem: (item) =>
      set((state) => {
        if (state.groupid !== item.groupid) return state;
        return {
          items: state.items.map((existing) =>
            existing.id === item.id ? item : existing,
          ),
        };
      }),

    removeExpenseItem: (expenseId) =>
      set((state) => ({
        items: state.items.filter((item) => item.id !== expenseId),
      })),

    updateSettlementItem: (item) =>
      set((state) => {
        if (state.groupid !== item.groupid) return state;
        return {
          items: state.items.map((existing) =>
            existing.id === item.id ? item : existing,
          ),
        };
      }),

    removeSettlementItem: (settlementId) =>
      set((state) => ({
        items: state.items.filter((item) => item.id !== settlementId),
      })),

    revealItem: (id) =>
      set((state) => {
        const idx = state.items.findIndex((item) => item.id === id);
        if (idx === -1 || state.visiblecount > idx) return state;
        return { visiblecount: idx + 1 };
      }),
  }),
);
