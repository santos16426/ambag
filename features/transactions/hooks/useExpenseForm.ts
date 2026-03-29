"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ExpenseFormMember,
  ExpenseSuccessReceiptData,
  ItemizedItem,
  MemberSplitState,
  SplitType,
  SplitValueField,
} from "../types/expense-form";
import type { TransactionItemExpense, TransactionUser } from "../types";
import {
  EXPENSE_FORM_BALANCE_THRESHOLD,
  EXPENSE_FORM_CURRENCY,
} from "../constants/expense-form";
import {
  submitExpense,
  updateExpense,
  type ExpenseUpdatePayload,
} from "../services/transaction-submit.service";

function memberToTransactionUser(m: ExpenseFormMember): TransactionUser {
  return { id: m.id, name: m.fullname, avatar: null };
}

export interface ExpenseSubmitPayload {
  groupId: string;
  description: string;
  amount: number;
  expenseDate: string;
  splitType: SplitType;
  paidBy: string | Record<string, string>;
  participants: Array<{ user_id: string; amount_owed: number }>;
  receiptUrl: string | null;
}

interface UseExpenseFormParams {
  members: ExpenseFormMember[];
  groupId?: string;
  currentUserId?: string | null;
  onClose: () => void;
  onSuccess?: (item: TransactionItemExpense) => void;
  mode?: "create" | "edit";
  initialExpense?: TransactionItemExpense | null;
}

export function useExpenseForm({
  members,
  groupId,
  currentUserId,
  onClose,
  onSuccess,
  mode,
  initialExpense,
}: UseExpenseFormParams) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [payMode, setPayMode] = useState<"single" | "multiple">("single");
  const [singlePayer, setSinglePayer] = useState<string | null>(() => {
    if (currentUserId && members.some((m) => m.id === currentUserId)) {
      return currentUserId;
    }
    return members[0]?.id ?? null;
  });
  const [multiplePayers, setMultiplePayers] = useState<
    Record<string, string>
  >({});
  const [splitType, setSplitType] = useState<SplitType>("equally");
  const [memberSplits, setMemberSplits] = useState<
    Record<string, MemberSplitState>
  >({});
  const [deselectedMembers, setDeselectedMembers] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successDescription, setSuccessDescription] = useState("");
  const [successAmount, setSuccessAmount] = useState("");
  const [successReceiptData, setSuccessReceiptData] =
    useState<ExpenseSuccessReceiptData | null>(null);
  const [reimbursementTarget, setReimbursementTarget] = useState<
    string | null
  >(null);
  const [items, setItems] = useState<ItemizedItem[]>([]);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currencySymbol = EXPENSE_FORM_CURRENCY.symbol;

  useEffect(() => {
    if (!initialExpense) return;

    const baseDate =
      initialExpense.expensedate ?? initialExpense.date ?? new Date().toISOString();
    const formattedDate = baseDate.split("T")[0] ?? new Date().toISOString().split("T")[0];
    const initialSplitType =
      (initialExpense.splittype as SplitType | null) ?? "equally";

    setStep("form");
    setDescription(initialExpense.name ?? "");
    setAmount(initialExpense.amount.toFixed(2));
    setExpenseDate(formattedDate);
    setSplitType(initialSplitType);
    setError(null);
    setIsSubmitting(false);
    setItems([]);
    setReimbursementTarget(null);

    if (initialExpense.payors.length <= 1) {
      const payerId = initialExpense.payors[0]?.id;
      setPayMode("single");
      setSinglePayer(
        payerId ??
          (currentUserId && members.some((m) => m.id === currentUserId)
            ? currentUserId
            : members[0]?.id ?? null),
      );
      setMultiplePayers({});
    } else {
      setPayMode("multiple");
      const perPayerAmount =
        initialExpense.amount / Math.max(initialExpense.payors.length, 1);
      const nextMultiple: Record<string, string> = {};
      initialExpense.payors.forEach((p) => {
        nextMultiple[p.id] = perPayerAmount.toFixed(2);
      });
      setMultiplePayers(nextMultiple);
    }

    const participantList = initialExpense.participants ?? [];
    const participantIds = new Set(participantList.map((p) => p.id));
    setDeselectedMembers(
      new Set(members.map((m) => m.id).filter((id) => !participantIds.has(id))),
    );

    const total = initialExpense.amount;
    const selectedCount = participantList.length;

    if (
      initialSplitType !== "equally" &&
      initialSplitType !== "itemized" &&
      initialSplitType !== "reimbursement" &&
      selectedCount > 0
    ) {
      const baseEqual = total / selectedCount;
      const amounts = participantList.map(
        (p) => p.amountOwed ?? p.amountowed ?? 0,
      );
      const minPositive = Math.min(...amounts.filter((a) => a > 0)) || 1;

      const nextSplits: Record<string, MemberSplitState> = {};
      participantList.forEach((p) => {
        const owed = p.amountOwed ?? p.amountowed ?? 0;
        nextSplits[p.id] = {
          user_id: p.id,
          amount_owed: owed,
          percentage:
            total > 0 ? Math.round((owed / total) * 10000) / 100 : 0,
          shares: Math.round((owed / minPositive) * 100) / 100 || 1,
          adjustment: Math.round((owed - baseEqual) * 100) / 100,
        };
      });
      setMemberSplits(nextSplits);
    } else {
      setMemberSplits({});
    }

    if (receiptImage) URL.revokeObjectURL(receiptImage);
    setReceiptImage(null);
    setReceiptImageUrl(initialExpense.receipturl);
  }, [initialExpense, currentUserId, members, receiptImage]);

  const selectedMembers = useMemo(
    () =>
      new Set(
        members.map((m) => m.id).filter((id) => !deselectedMembers.has(id)),
      ),
    [members, deselectedMembers],
  );
  const selectedIds = Array.from(selectedMembers);

  const effectiveSinglePayer =
    singlePayer ?? currentUserId ?? members[0]?.id ?? null;

  const fullMultiplePayers = useMemo(() => {
    const r: Record<string, string> = {};
    members.forEach((m) => {
      r[m.id] = multiplePayers[m.id] ?? "";
    });
    return r;
  }, [members, multiplePayers]);

  const itemsTotal = useMemo(
    () => items.reduce((acc, i) => acc + (i.amount || 0), 0),
    [items],
  );
  const amountNum =
    splitType === "itemized"
      ? itemsTotal
      : parseFloat(amount) || 0;
  const amountDisplay =
    splitType === "itemized" ? itemsTotal.toFixed(2) : amount;

  const memberSplitsComputed = useMemo(() => {
    const total = amountNum;
    const next: Record<string, MemberSplitState> = { ...memberSplits };
    members.forEach((m) => {
      const current = next[m.id] ?? {
        user_id: m.id,
        amount_owed: 0,
        percentage: 0,
        shares: 1,
        adjustment: 0,
      };
      next[m.id] = {
        ...current,
        amount_owed:
          splitType === "exact" ? (current.amount_owed ?? 0) : 0,
      };
    });

    if (splitType === "reimbursement" && reimbursementTarget && total > 0) {
      next[reimbursementTarget] = {
        ...(next[reimbursementTarget] ?? {
          user_id: reimbursementTarget,
          amount_owed: 0,
          percentage: 0,
          shares: 1,
          adjustment: 0,
        }),
        amount_owed: total,
      };
      return next;
    }

    if (splitType === "itemized") {
      items.forEach((item) => {
        if (item.assignedTo.length > 0 && (item.amount || 0) > 0) {
          const split = item.amount / item.assignedTo.length;
          item.assignedTo.forEach((uid) => {
            const cur = next[uid] ?? {
              user_id: uid,
              amount_owed: 0,
              percentage: 0,
              shares: 1,
              adjustment: 0,
            };
            next[uid] = {
              ...cur,
              amount_owed: (cur.amount_owed ?? 0) + split,
            };
          });
        }
      });
      return next;
    }

    if (selectedIds.length === 0) return next;

    if (splitType === "equally") {
      const perPerson = total / selectedIds.length || 0;
      selectedIds.forEach((id) => {
        const current = next[id]!;
        next[id] = { ...current, amount_owed: perPerson };
      });
    } else if (splitType === "shares") {
      const totalShares = selectedIds.reduce(
        (sum, id) => sum + (next[id]?.shares ?? 0),
        0,
      );
      selectedIds.forEach((id) => {
        const shares = next[id]?.shares ?? 0;
        const current = next[id]!;
        next[id] = {
          ...current,
          amount_owed:
            totalShares > 0 ? (shares / totalShares) * total : 0,
        };
      });
    } else if (splitType === "adjustments") {
      const baseEqual = total / selectedIds.length || 0;
      selectedIds.forEach((id) => {
        const current = next[id]!;
        next[id] = {
          ...current,
          amount_owed: baseEqual + (current.adjustment ?? 0),
        };
      });
    } else if (splitType === "percentage") {
      selectedIds.forEach((id) => {
        const current = next[id]!;
        next[id] = {
          ...current,
          amount_owed: ((current.percentage ?? 0) / 100) * total,
        };
      });
    }
    return next;
  }, [
    amountNum,
    splitType,
    selectedIds,
    reimbursementTarget,
    items,
    members,
    memberSplits,
  ]);

  const currentSplitTotal =
    splitType === "reimbursement" || splitType === "itemized"
      ? members.reduce(
          (sum, m) => sum + (memberSplitsComputed[m.id]?.amount_owed ?? 0),
          0,
        )
      : selectedIds.reduce(
          (sum, id) => sum + (memberSplitsComputed[id]?.amount_owed ?? 0),
          0,
        );
  const remainingSplit = amountNum - currentSplitTotal;
  const isBalanced = Math.abs(remainingSplit) < EXPENSE_FORM_BALANCE_THRESHOLD;
  const itemizedValid =
    items.length > 0 &&
    items.every(
      (i) =>
        (i.amount || 0) > 0 &&
        i.assignedTo.length > 0 &&
        i.name.trim() !== "",
    );
  const reimbursementValid =
    splitType !== "reimbursement" ||
    (reimbursementTarget != null && amountNum > 0);
  const isValid =
    description.trim() !== "" &&
    effectiveSinglePayer &&
    (splitType === "reimbursement"
      ? reimbursementValid
      : splitType === "itemized"
        ? itemizedValid && isBalanced
        : amountNum > 0 &&
          selectedIds.length > 0 &&
          (splitType === "equally" || splitType === "shares" || isBalanced));

  function resetAndClose() {
    setStep("form");
    setDescription("");
    setAmount("");
    setExpenseDate(new Date().toISOString().split("T")[0]);
    setPayMode("single");
    setSinglePayer(
      currentUserId && members.some((m) => m.id === currentUserId)
        ? currentUserId
        : members[0]?.id ?? null,
    );
    setMultiplePayers({});
    setSplitType("equally");
    setMemberSplits({});
    setDeselectedMembers(new Set());
    setReimbursementTarget(null);
    setItems([]);
    if (receiptImage) URL.revokeObjectURL(receiptImage);
    setReceiptImage(null);
    setReceiptImageUrl(null);
    setError(null);
    setSuccessDescription("");
    setSuccessAmount("");
    setSuccessReceiptData(null);
    onClose();
  }

  function handleReceiptChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setReceiptImage(url);
    setReceiptImageUrl(url);
    event.target.value = "";
  }

  function addItemizedItem() {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        name: "",
        amount: 0,
        assignedTo: Array.from(selectedMembers),
      },
    ]);
  }

  function updateItem(
    index: number,
    updates: Partial<Pick<ItemizedItem, "name" | "amount" | "assignedTo">>,
  ) {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, ...updates };
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleItemAssignee(itemIndex: number, userId: string) {
    setItems((prev) => {
      const next = [...prev];
      const item = next[itemIndex]!;
      const assignedTo = item.assignedTo.includes(userId)
        ? item.assignedTo.filter((id) => id !== userId)
        : [...item.assignedTo, userId];
      next[itemIndex] = { ...item, assignedTo };
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValid) return;
    setError(null);
    setIsSubmitting(true);

    const participantsPayload = (() => {
      const out: Array<{ user_id: string; amount_owed: number }> = [];
      members.forEach((m) => {
        const owed = memberSplitsComputed[m.id]?.amount_owed ?? 0;
        if (owed > 0) out.push({ user_id: m.id, amount_owed: owed });
      });
      return out;
    })();

    const payload: ExpenseSubmitPayload = {
      groupId: groupId ?? "",
      description: description.trim(),
      amount: amountNum,
      expenseDate,
      splitType,
      paidBy:
        payMode === "single"
          ? (effectiveSinglePayer ?? "")
          : { ...fullMultiplePayers },
      participants: participantsPayload,
      receiptUrl: receiptImage,
    };

    const isEditMode = typeof initialExpense !== "undefined" && initialExpense !== null;
    const { data, error } = isEditMode
      ? await updateExpense({
          ...(payload as ExpenseUpdatePayload),
          expenseId: initialExpense.id,
        })
      : await submitExpense(payload);

    if (error) {
      setError(error.message);
      setIsSubmitting(false);
      return;
    }

    const row = data?.expense;
    if (!row) {
      setError(isEditMode ? "Failed to update expense" : "Failed to create expense");
      setIsSubmitting(false);
      return;
    }

    setSuccessDescription(description);
    setSuccessAmount(amountDisplay);
    setSuccessReceiptData({
      description: description.trim(),
      amount: amountNum,
      expense_date: expenseDate,
      ...(payMode === "single" && effectiveSinglePayer
        ? { paid_by: effectiveSinglePayer }
        : {
            payments: (() => {
              const entries: Array<[string, number]> = members.map((m) => [
                m.id,
                parseFloat(fullMultiplePayers[m.id] ?? "0") || 0,
              ]);
              return Object.fromEntries(entries.filter(([, amt]) => amt > 0));
            })(),
          }),
      participants: participantsPayload,
    });
    setStep("success");

    const createdBy = currentUserId
      ? members.find((m) => m.id === currentUserId)
      : null;
    const payors: TransactionUser[] =
      payMode === "single" && effectiveSinglePayer
        ? (() => {
            const p = members.find((m) => m.id === effectiveSinglePayer);
            return p ? [memberToTransactionUser(p)] : [];
          })()
        : members
            .filter((m) => parseFloat(fullMultiplePayers[m.id] ?? "0") > 0)
            .map(memberToTransactionUser);
    const participants: TransactionUser[] = members
      .filter((m) => (memberSplitsComputed[m.id]?.amount_owed ?? 0) > 0)
      .map(memberToTransactionUser);

    const item: TransactionItemExpense = {
      type: "expense",
      id: row.id,
      groupid: row.groupid,
      amount: Number(row.amount),
      createdat: row.createdat,
      date: row.expensedate ?? row.createdat,
      receipturl: row.receipturl ?? null,
      name: row.name ?? null,
      notes: row.notes ?? null,
      expensedate: row.expensedate ?? null,
      splittype: row.splittype ?? null,
      createdby: createdBy ? memberToTransactionUser(createdBy) : null,
      payors,
      participants,
    };

    console.log("[ExpenseForm] submit", {
      splitType,
      payload,
      item,
      ...(splitType === "itemized" && { itemized: items }),
    });

    onSuccess?.(item);
    setIsSubmitting(false);
  }

  function toggleMember(id: string) {
    setDeselectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSplitValueChange(
    id: string,
    value: string,
    field: SplitValueField,
  ) {
    const numVal = parseFloat(value) || 0;
    setMemberSplits((prev) => {
      const updated: Record<string, MemberSplitState> = {
        ...prev,
        [id]: {
          ...(prev[id] ?? {
            user_id: id,
            amount_owed: 0,
            percentage: 0,
            shares: 1,
            adjustment: 0,
          }),
          [field]: numVal,
        },
      };
      const total = amountNum;
      if (field === "shares" && splitType === "shares") {
        const totalShares = selectedIds.reduce(
          (sum, mid) =>
            sum +
            (mid === id
              ? numVal
              : (updated[mid]?.shares ?? prev[mid]?.shares ?? 0)),
          0,
        );
        selectedIds.forEach((mid) => {
          const shares =
            mid === id
              ? numVal
              : (updated[mid]?.shares ?? prev[mid]?.shares ?? 0);
          const current = updated[mid]!;
          updated[mid] = {
            ...current,
            amount_owed:
              totalShares > 0 ? (shares / totalShares) * total : 0,
          };
        });
      } else if (field === "percentage" && splitType === "percentage") {
        const current = updated[id]!;
        updated[id] = { ...current, amount_owed: (numVal / 100) * total };
      } else if (field === "adjustment" && splitType === "adjustments") {
        const baseEqual = total / selectedIds.length || 0;
        const current = updated[id]!;
        updated[id] = { ...current, amount_owed: baseEqual + numVal };
      } else if (field === "amount_owed" && splitType === "exact") {
        const current = updated[id]!;
        updated[id] = { ...current, amount_owed: numVal };
      }
      return updated;
    });
  }

  function handleMultiplePayerChange(id: string, value: string) {
    const updated = { ...multiplePayers, [id]: value };
    const sum = members.reduce(
      (t, m) => t + (parseFloat(updated[m.id] ?? "0") || 0),
      0,
    );
    setMultiplePayers(updated);
    setAmount(sum > 0 ? sum.toFixed(2) : "");
  }

  function clearReceipt() {
    if (receiptImage) URL.revokeObjectURL(receiptImage);
    setReceiptImage(null);
    setReceiptImageUrl(null);
  }

  return {
    step,
    description,
    setDescription,
    amount,
    setAmount,
    amountDisplay,
    expenseDate,
    setExpenseDate,
    payMode,
    setPayMode,
    singlePayer,
    setSinglePayer,
    effectiveSinglePayer,
    multiplePayers: fullMultiplePayers,
    splitType,
    setSplitType,
    memberSplits: memberSplitsComputed,
    selectedMembers,
    isSubmitting,
    error,
    successDescription,
    successAmount,
    successReceiptData,
    reimbursementTarget,
    setReimbursementTarget,
    items,
    receiptImage,
    receiptImageUrl,
    fileInputRef,
    currencySymbol,
    amountNum,
    selectedIds,
    currentSplitTotal,
    remainingSplit,
    isBalanced,
    isValid,
    resetAndClose,
    handleReceiptChange,
    addItemizedItem,
    updateItem,
    removeItem,
    toggleItemAssignee,
    handleSubmit,
    toggleMember,
    handleSplitValueChange,
    handleMultiplePayerChange,
    clearReceipt,
  };
}
