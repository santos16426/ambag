"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import GroupDetailsCard from "@/features/groups/components/GroupDetailsCard";
import { MembersCard } from "@/features/groups/components/MembersCard";
import {
  TransactionList,
  ExpenseForm,
  SettlementForm,
  useTransactionListStore,
  type ExpenseFormMember,
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

function GroupDetailPage() {
  const params = useParams();
  const id = (params?.id as string) ?? null;
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [settlementFormOpen, setSettlementFormOpen] = useState(false);
  const sessionUser = useAuthStore((s) => s.sessionUser);

  const {
    group,
    members,
    membersCardOpen: isMembersCardOpen,
    loading,
    error,
    fetchGroupDetails,
  } = useGroupDetailsStore();

  const formMembers = useMemo((): ExpenseFormMember[] => {
    return members
      .filter((m): m is typeof m & { user: NonNullable<typeof m.user> } => m.type === "member" && m.user != null)
      .map((m) => ({
        id: m.user.id,
        fullname: m.user.fullname,
        email: m.user.email,
      }));
  }, [members]);

  useEffect(() => {
    if (id) fetchGroupDetails(id);
  }, [id, fetchGroupDetails]);

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
    <div className="p-4 lg:p-10">
      <div className="flex flex-col lg:flex-row gap-8 items-stretch">
        <div className="flex-1 min-w-0 space-y-8">
          <GroupDetailsCard group={group} members={members} />
        </div>
        <motion.div
          className="overflow-hidden shrink-0 sticky top-8"
          initial={false}
          animate={{
            width: isMembersCardOpen ? 380 : 0,
            opacity: isMembersCardOpen ? 1 : 0,
          }}
          transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
          style={{ minWidth: 0 }}
        >
          <AnimatePresence initial={false} mode="wait">
            {isMembersCardOpen && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                className="w-[380px]"
              >
                <MembersCard
                  members={members}
                  createdBy={group.createdby}
                  groupId={group.id}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <div className="mt-8">
        <TransactionList
          groupid={group.id}
          currentUserId={sessionUser?.id ?? null}
          onOpenExpense={() => setExpenseFormOpen(true)}
          onOpenSettlement={() => setSettlementFormOpen(true)}
        />
      </div>

      <ExpenseForm
        isOpen={expenseFormOpen}
        onClose={() => setExpenseFormOpen(false)}
        groupId={group.id}
        members={formMembers}
        currentUserId={sessionUser?.id ?? null}
        onSuccess={(item) => {
          useTransactionListStore.getState().prependExpenseItem(item);
        }}
      />
      <SettlementForm
        isOpen={settlementFormOpen}
        onClose={() => setSettlementFormOpen(false)}
        groupId={group.id}
        members={formMembers}
        currentUserId={sessionUser?.id ?? null}
        onSuccess={(item) => {
          useTransactionListStore.getState().prependSettlementItem(item);
        }}
      />
    </div>
  );
}

export default GroupDetailPage;
