"use client";

import { useEffect } from "react";

import { useTransactionListStore } from "../store/transaction-list.store";
import type { TransactionItem } from "../types";
import { TRANSACTION_LIST_PAGE_SIZE } from "../constants";

export interface UseTransactionListOptions {
  pagesize?: number;
  enabled?: boolean;
}

export interface UseTransactionListResult {
  items: TransactionItem[];
  total: number;
  hasmore: boolean;
  loadmore: () => void;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTransactionList(
  groupid: string | null,
  options: UseTransactionListOptions = {},
): UseTransactionListResult {
  const { pagesize = TRANSACTION_LIST_PAGE_SIZE, enabled = true } = options;

  const items = useTransactionListStore((s) => s.items);
  const visiblecount = useTransactionListStore((s) => s.visiblecount);
  const storepagesize = useTransactionListStore((s) => s.pagesize);
  const loading = useTransactionListStore((s) => s.loading);
  const error = useTransactionListStore((s) => s.error);
  const fetchtransactionlist = useTransactionListStore(
    (s) => s.fetchtransactionlist,
  );
  const loadmore = useTransactionListStore((s) => s.loadmore);
  const setpagesize = useTransactionListStore((s) => s.setpagesize);
  const cleartransactionlist = useTransactionListStore(
    (s) => s.cleartransactionlist,
  );

  useEffect(() => {
    if (storepagesize !== pagesize) {
      setpagesize(pagesize);
    }
  }, [pagesize, storepagesize, setpagesize]);

  useEffect(() => {
    if (!groupid) {
      const tid = setTimeout(() => cleartransactionlist(), 0);
      return () => clearTimeout(tid);
    }
    if (enabled && groupid) {
      const tid = setTimeout(() => {
        fetchtransactionlist(groupid);
      }, 0);
      return () => clearTimeout(tid);
    }
  }, [enabled, groupid, fetchtransactionlist, cleartransactionlist]);

  const visibleitems = items.slice(0, visiblecount);
  const hasmore = visiblecount < items.length;

  return {
    items: visibleitems,
    total: items.length,
    hasmore,
    loadmore,
    loading,
    error,
    refetch: () =>
      groupid
        ? fetchtransactionlist(groupid, { force: true })
        : Promise.resolve(),
  };
}
