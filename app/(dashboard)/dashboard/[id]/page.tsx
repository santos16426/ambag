"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
  usePathname,
} from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import GroupDetailsCard from "@/features/groups/components/GroupDetailsCard";
import { MembersCard } from "@/features/groups/components/MembersCard";
import {
  TransactionList,
  ExpenseForm,
  SettlementForm,
  DeleteExpenseModal,
  DeleteSettlementModal,
  useTransactionListStore,
  type ExpenseFormMember,
  type TransactionItemExpense,
  type TransactionItemSettlement,
} from "@/features/transactions";
import {
  GroupDetailsCardSkeleton,
  MembersCardSkeleton,
} from "@/features/groups/components/Skeleton";
import {
  GroupDetailError,
  GroupNotFound,
} from "@/features/groups/components/Errors";
import { useGroupDetailsStore } from "@/features/groups";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { GroupSummary } from "@/features/groups/components/GroupSummary";
import { useGroupSummaryStore } from "@/features/groups/store/group-summary.store";

function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const id = (params?.id as string) ?? null;

  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [settlementFormOpen, setSettlementFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] =
    useState<TransactionItemExpense | null>(null);
  const [deletingExpense, setDeletingExpense] =
    useState<TransactionItemExpense | null>(null);
  const [editingSettlement, setEditingSettlement] =
    useState<TransactionItemSettlement | null>(null);
  const [deletingSettlement, setDeletingSettlement] =
    useState<TransactionItemSettlement | null>(null);
  const [settlementDefaults, setSettlementDefaults] = useState<{
    payerId: string;
    receiverId: string | null;
    amount: number | null;
    maxAmount: number | null;
  } | null>(null);
  const [highlightedExpenseId, setHighlightedExpenseId] = useState<
    string | null
  >(null);

  const sessionUser = useAuthStore((s) => s.sessionUser);
  const { group, members, loading, error, fetchGroupDetails } =
    useGroupDetailsStore();

  const formMembers = useMemo((): ExpenseFormMember[] => {
    return members
      .filter(
        (m): m is typeof m & { user: NonNullable<typeof m.user> } =>
          m.type === "member" && m.user != null,
      )
      .map((m) => ({
        id: m.user.id,
        fullname: m.user.fullname,
        email: m.user.email,
      }));
  }, [members]);

  useEffect(() => {
    if (id) fetchGroupDetails(id);
  }, [id, fetchGroupDetails]);

  const processedSettleRef = useRef<string | null>(null);
  const processedHighlightRef = useRef<string | null>(null);

  useEffect(() => {
    const settle = searchParams.get("settle");
    const highlight = searchParams.get("highlight");

    if (settle && settle !== processedSettleRef.current && sessionUser?.id) {
      processedSettleRef.current = settle;
      // "open" is the sentinel for notifications without a stored referenceId
      const isUUID = settle !== "open" && /^[0-9a-f-]{36}$/i.test(settle);
      setSettlementDefaults({
        payerId: sessionUser.id,
        receiverId: isUUID ? settle : null,
        amount: null,
        maxAmount: null,
      });
      setSettlementFormOpen(true);
      router.replace(pathname, { scroll: false });
    }

    if (highlight && highlight !== processedHighlightRef.current) {
      processedHighlightRef.current = highlight;
      setHighlightedExpenseId(highlight);
      useTransactionListStore.getState().revealItem(highlight);
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, sessionUser?.id, pathname, router]);

  // Re-run revealItem once transaction items finish loading (async fetch).
  useEffect(() => {
    if (!highlightedExpenseId) return;
    useTransactionListStore.getState().revealItem(highlightedExpenseId);
  }, [highlightedExpenseId]);

  const handleRetry = useCallback(() => {
    if (id) fetchGroupDetails(id);
  }, [id, fetchGroupDetails]);

  if (!id) {
    return (
      <div className="p-4 lg:p-10">
        <p className="text-sm text-slate-500">No group selected.</p>
      </div>
    );
  }

  if (loading && !group) {
    return (
      <div className="p-4 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-8">
            <GroupDetailsCardSkeleton />
          </div>
          <div className="lg:col-span-4 sticky top-8">
            <MembersCardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <GroupDetailError message={error} onRetry={handleRetry} />;
  }

  if (!group) {
    return <GroupNotFound />;
  }

  return (
    <div className="grid grid-cols-12 gap-6 p-4 lg:p-10">
      <div className="col-span-12 lg:col-span-9 space-y-6">
        <GroupDetailsCard group={group} members={members} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <GroupSummary
              groupId={group.id}
              currentUserId={sessionUser?.id ?? null}
                onSettleWith={(payload) => {
                  setSettlementDefaults({
                    payerId: payload.payerId,
                    receiverId: payload.receiverId,
                    amount: payload.amount,
                    maxAmount: payload.maxAmount,
                  });
                setSettlementFormOpen(true);
              }}
            />
          </div>
          <div className="lg:col-span-8 space-y-6">
            <TransactionList
              groupid={group.id}
              currentUserId={sessionUser?.id ?? null}
              highlightId={highlightedExpenseId}
              onOpenExpense={() => {
                setEditingExpense(null);
                setExpenseFormOpen(true);
              }}
              onOpenSettlement={() => {
                setSettlementDefaults(null);
                setSettlementFormOpen(true);
              }}
              onEditExpense={(item) => {
                setEditingExpense(item);
                setExpenseFormOpen(true);
              }}
              onDeleteExpense={(item) => setDeletingExpense(item)}
              onEditSettlement={(item) => {
                setEditingSettlement(item);
                setSettlementFormOpen(true);
              }}
              onDeleteSettlement={(item) => setDeletingSettlement(item)}
            />
          </div>
        </div>
      </div>
      <div className="col-span-12 lg:col-span-3 space-y-6">
        <MembersCard
          members={members}
          createdBy={group.createdby}
          groupId={group.id}
        />
      </div>
      <ExpenseForm
        isOpen={expenseFormOpen}
        onClose={() => {
          setExpenseFormOpen(false);
          setEditingExpense(null);
        }}
        groupId={group.id}
        members={formMembers}
        currentUserId={sessionUser?.id ?? null}
        mode={editingExpense ? "edit" : "create"}
        initialExpense={editingExpense}
        onSuccess={(item) => {
          const store = useTransactionListStore.getState();
          if (editingExpense) {
            store.updateExpenseItem(item);
          } else {
            store.prependExpenseItem(item);
          }
          useGroupSummaryStore
            .getState()
            .fetchGroupSummary(group.id, { force: true });
          setEditingExpense(null);
        }}
        onDelete={(expenseId) => {
          useTransactionListStore.getState().removeExpenseItem(expenseId);
          useGroupSummaryStore
            .getState()
            .fetchGroupSummary(group.id, { force: true });
          setEditingExpense(null);
          setExpenseFormOpen(false);
        }}
      />
      <DeleteExpenseModal
        expense={deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onSuccess={(expenseId) => {
          useTransactionListStore.getState().removeExpenseItem(expenseId);
          useGroupSummaryStore
            .getState()
            .fetchGroupSummary(group.id, { force: true });
        }}
      />
      <SettlementForm
        isOpen={settlementFormOpen}
        onClose={() => {
          setSettlementFormOpen(false);
          setSettlementDefaults(null);
          setEditingSettlement(null);
        }}
        groupId={group.id}
        members={formMembers}
        currentUserId={sessionUser?.id ?? null}
        initialPayerId={settlementDefaults?.payerId ?? null}
        initialReceiverId={settlementDefaults?.receiverId ?? null}
        initialAmount={settlementDefaults?.amount ?? null}
        maxAmount={settlementDefaults?.maxAmount ?? null}
        editingSettlement={editingSettlement}
        onSuccess={(item) => {
          const store = useTransactionListStore.getState();
          if (editingSettlement) {
            store.updateSettlementItem(item);
          } else {
            store.prependSettlementItem(item);
          }
          useGroupSummaryStore
            .getState()
            .fetchGroupSummary(group.id, { force: true });
          setEditingSettlement(null);
        }}
      />
      <DeleteSettlementModal
        settlement={deletingSettlement}
        onClose={() => setDeletingSettlement(null)}
        onSuccess={(settlementId) => {
          useTransactionListStore.getState().removeSettlementItem(settlementId);
          useGroupSummaryStore
            .getState()
            .fetchGroupSummary(group.id, { force: true });
        }}
      />
    </div>
  );
}

export default GroupDetailPage;
