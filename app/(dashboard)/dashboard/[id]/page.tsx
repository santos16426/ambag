"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useParams,
  useRouter,
  useSearchParams,
  usePathname,
} from "next/navigation";
import { Archive } from "lucide-react";

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
    return members.flatMap((m) => {
      if (m.type === "member" && m.user != null) {
        return [
          {
            id: m.user.id,
            fullname: m.user.fullname,
            email: m.user.email,
          },
        ];
      }
      if (m.type === "pending_invite" && m.email) {
        const email = m.email.toLowerCase().trim();
        return [
          {
            id: email,
            fullname: null,
            email,
          },
        ];
      }
      return [];
    });
  }, [members]);

  useEffect(() => {
    if (id) fetchGroupDetails(id);
  }, [id, fetchGroupDetails]);

  useEffect(() => {
    if (!group?.name) return;
    document.title = `Ambag | ${group.name}`;
  }, [group?.name]);

  const processedSettleRef = useRef<string | null>(null);
  const processedHighlightRef = useRef<string | null>(null);

  useEffect(() => {
    const settle = searchParams.get("settle");
    const highlight = searchParams.get("highlight");
    const isGroupArchived = group?.archivedat != null;

    if (
      !isGroupArchived &&
      settle &&
      settle !== processedSettleRef.current &&
      sessionUser?.id
    ) {
      processedSettleRef.current = settle;
      // "open" is the sentinel for notifications without a stored referenceId
      const isUUID = settle !== "open" && /^[0-9a-f-]{36}$/i.test(settle);
      queueMicrotask(() => {
        setSettlementDefaults({
          payerId: sessionUser.id,
          receiverId: isUUID ? settle : null,
          amount: null,
          maxAmount: null,
        });
        setSettlementFormOpen(true);
      });
      router.replace(pathname, { scroll: false });
    }

    if (highlight && highlight !== processedHighlightRef.current) {
      processedHighlightRef.current = highlight;
      queueMicrotask(() => {
        setHighlightedExpenseId(highlight);
      });
      useTransactionListStore.getState().revealItem(highlight);
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, sessionUser?.id, pathname, router, group?.archivedat]);

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
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-8 space-y-8">
            <GroupDetailsCardSkeleton />
          </div>
          <div className="xl:col-span-4 sticky top-8">
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

  const isGroupArchived = group.archivedat != null;

  return (
    <div className="grid grid-cols-12 gap-6 p-4 lg:p-10">
      {isGroupArchived && (
        <div
          className="col-span-12 flex gap-4 rounded-[1.75rem] border border-amber-200 bg-linear-to-r from-amber-50 to-amber-50/80 px-5 py-4 shadow-sm shadow-amber-900/5"
          role="status"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-700">
            <Archive className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-black uppercase tracking-[0.12em] text-amber-900">
              This group is archived
            </p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-amber-800/85">
              You can still review activity and balances. Adding or editing
              expenses, settlements, group details, and members is not available
              for archived groups.
            </p>
          </div>
        </div>
      )}
      <div className="col-span-12 xl:col-span-9 space-y-6">
        <GroupDetailsCard group={group} />
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-4 space-y-6">
            <GroupSummary
              groupId={group.id}
              currentUserId={sessionUser?.id ?? null}
              isArchived={isGroupArchived}
              onSettleWith={(payload) => {
                if (isGroupArchived) return;
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
          <div className="xl:col-span-8 space-y-6">
            <TransactionList
              groupid={group.id}
              currentUserId={sessionUser?.id ?? null}
              isArchived={isGroupArchived}
              highlightId={highlightedExpenseId}
              onOpenExpense={() => {
                if (isGroupArchived) return;
                setEditingExpense(null);
                setExpenseFormOpen(true);
              }}
              onOpenSettlement={() => {
                if (isGroupArchived) return;
                setSettlementDefaults(null);
                setSettlementFormOpen(true);
              }}
              onEditExpense={(item) => {
                if (isGroupArchived) return;
                setEditingExpense(item);
                setExpenseFormOpen(true);
              }}
              onDeleteExpense={(item) => {
                if (isGroupArchived) return;
                setDeletingExpense(item);
              }}
              onEditSettlement={(item) => {
                if (isGroupArchived) return;
                setEditingSettlement(item);
                setSettlementFormOpen(true);
              }}
              onDeleteSettlement={(item) => {
                if (isGroupArchived) return;
                setDeletingSettlement(item);
              }}
            />
          </div>
        </div>
      </div>
      <div className="col-span-12 xl:col-span-3 space-y-6">
        <MembersCard
          key={group.id}
          members={members}
          createdBy={group.createdby}
          groupId={group.id}
          isArchived={isGroupArchived}
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
