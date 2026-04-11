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

/** Whole cents for itemized math (avoids float drift vs receipt total). */
function moneyToCents(value: number): number {
  return Math.round((value || 0) * 100);
}

function memberToTransactionUser(m: ExpenseFormMember): TransactionUser {
  return { id: m.id, name: m.fullname, avatar: null, email: m.email };
}

function mapSavedLineItemsToForm(
  expense: TransactionItemExpense,
): ItemizedItem[] {
  const raw = expense.lineitems;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.map((row, idx) => ({
    id:
      row.id && row.id.length > 0
        ? row.id
        : globalThis.crypto?.randomUUID?.() ?? `line-${idx}-${Date.now()}`,
    name: row.name ?? "",
    amount: Number(row.amount) || 0,
    assignedTo: Array.isArray(row.assignedTo)
      ? row.assignedTo.filter(
          (uid): uid is string => typeof uid === "string" && uid.length > 0,
        )
      : [],
  }));
}

function normalizeParticipantEmail(
  value: string | null | undefined,
): string | null {
  const t = (value ?? "").trim().toLowerCase();
  return t.length > 0 ? t : null;
}

/**
 * Maps feed payor/participant (uuid and/or email) to ExpenseFormMember.id.
 * Pending invites use normalized email as member id; API rows often have id null + email only.
 */
function resolveExpenseFormMemberId(
  user: TransactionUser,
  members: ExpenseFormMember[],
): string | null {
  if (user.id && members.some((m) => m.id === user.id)) return user.id;
  const em = normalizeParticipantEmail(user.email);
  if (em) {
    const byEmail = members.find(
      (m) => normalizeParticipantEmail(m.email) === em,
    );
    if (byEmail) return byEmail.id;
  }
  if (user.id) return user.id;
  return null;
}

function participantFormMemberIds(
  participants: TransactionUser[],
  members: ExpenseFormMember[],
): Set<string> {
  const keys = new Set<string>();
  for (const p of participants) {
    const mid = resolveExpenseFormMemberId(p, members);
    if (mid) keys.add(mid);
  }
  return keys;
}

export interface ExpenseSubmitPayload {
  groupId: string;
  description: string;
  amount: number;
  expenseDate: string;
  splitType: SplitType;
  paidBy: string | Record<string, string>;
  participants: Array<{ user_id?: string; email?: string; amount_owed: number }>;
  receiptUrl: string | null;
  /** Sent when splitType is itemized; persisted as expenseItems + participants. */
  itemized?: Array<{
    name: string;
    amount: number;
    assignedTo: string[];
  }>;
}

interface UseExpenseFormParams {
  members: ExpenseFormMember[];
  groupId?: string;
  currentUserId?: string | null;
  onClose: () => void;
  onSuccess?: (item: TransactionItemExpense) => void;
  initialExpense?: TransactionItemExpense | null;
}

export function useExpenseForm({
  members,
  groupId,
  currentUserId,
  onClose,
  onSuccess,
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
  /** Member ids whose % was typed by the user; everyone else shares the remainder equally. */
  const [percentageManualIds, setPercentageManualIds] = useState<
    Set<string>
  >(() => new Set());
  /** Member ids whose exact amount was typed; everyone else shares the remainder equally (cents-safe). */
  const [exactManualIds, setExactManualIds] = useState<Set<string>>(
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

  const prevSplitTypeForManualRef = useRef<SplitType | null>(null);

  useEffect(() => {
    const prev = prevSplitTypeForManualRef.current;
    if (initialExpense == null && prev !== null) {
      if (splitType === "percentage" && prev !== "percentage") {
        queueMicrotask(() => {
          setPercentageManualIds(new Set());
        });
      }
      if (splitType === "exact" && prev !== "exact") {
        queueMicrotask(() => {
          setExactManualIds(new Set());
        });
      }
      if (splitType === "itemized" && prev !== "itemized") {
        queueMicrotask(() => {
          setDeselectedMembers(new Set());
        });
      }
    }
    prevSplitTypeForManualRef.current = splitType;
  }, [splitType, initialExpense]);

  useEffect(() => {
    if (!initialExpense) return;

    const baseDate =
      initialExpense.expensedate ?? initialExpense.date ?? new Date().toISOString();
    const formattedDate = baseDate.split("T")[0] ?? new Date().toISOString().split("T")[0];
    const initialSplitType =
      (initialExpense.splittype as SplitType | null) ?? "equally";

    queueMicrotask(() => {
      setStep("form");
      setDescription(initialExpense.name ?? "");
      setAmount(initialExpense.amount.toFixed(2));
      setExpenseDate(formattedDate);
      setSplitType(initialSplitType);
      setError(null);
      setIsSubmitting(false);
      setItems(
        initialSplitType === "itemized"
          ? mapSavedLineItemsToForm(initialExpense)
          : [],
      );
      setReimbursementTarget(null);
    });

    if (initialExpense.payors.length <= 1) {
      const payor = initialExpense.payors[0];
      const resolvedPayerId = payor
        ? resolveExpenseFormMemberId(payor, members)
        : null;
      queueMicrotask(() => {
        setPayMode("single");
        const payerInRoster =
          resolvedPayerId != null &&
          members.some((m) => m.id === resolvedPayerId);
        setSinglePayer(
          payerInRoster
            ? resolvedPayerId
            : payor?.id ??
                (currentUserId && members.some((m) => m.id === currentUserId)
                  ? currentUserId
                  : members[0]?.id ?? null),
        );
        setMultiplePayers({});
      });
    } else {
      queueMicrotask(() => {
        setPayMode("multiple");
      });
      const perPayerAmount =
        initialExpense.amount / Math.max(initialExpense.payors.length, 1);
      const nextMultiple: Record<string, string> = {};
      initialExpense.payors.forEach((p) => {
        const key =
          resolveExpenseFormMemberId(p, members) ??
          p.id ??
          normalizeParticipantEmail(p.email) ??
          "";
        if (key) nextMultiple[key] = perPayerAmount.toFixed(2);
      });
      queueMicrotask(() => {
        setMultiplePayers(nextMultiple);
      });
    }

    const participantList = initialExpense.participants ?? [];
    const participantKeys = participantFormMemberIds(
      participantList,
      members,
    );
    queueMicrotask(() => {
      setDeselectedMembers(
        new Set(
          members
            .map((m) => m.id)
            .filter((id) => !participantKeys.has(id)),
        ),
      );
    });

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
        const mid = resolveExpenseFormMemberId(p, members);
        if (!mid) return;
        const owed = p.amountOwed ?? p.amountowed ?? 0;
        nextSplits[mid] = {
          user_id: mid,
          amount_owed: owed,
          percentage:
            total > 0 ? Math.round((owed / total) * 10000) / 100 : 0,
          shares: Math.round((owed / minPositive) * 100) / 100 || 1,
          adjustment: Math.round((owed - baseEqual) * 100) / 100,
        };
      });
      queueMicrotask(() => {
        setMemberSplits(nextSplits);
      });
    } else {
      queueMicrotask(() => {
        setMemberSplits({});
      });
    }

    queueMicrotask(() => {
      if (selectedCount > 0) {
        const ids = new Set<string>();
        participantList.forEach((p) => {
          const mid = resolveExpenseFormMemberId(p, members);
          if (mid) ids.add(mid);
        });
        if (initialSplitType === "percentage") {
          setPercentageManualIds(ids);
        } else {
          setPercentageManualIds(new Set());
        }
        if (initialSplitType === "exact") {
          setExactManualIds(ids);
        } else {
          setExactManualIds(new Set());
        }
      } else {
        setPercentageManualIds(new Set());
        setExactManualIds(new Set());
      }
    });

    if (receiptImage) URL.revokeObjectURL(receiptImage);
    queueMicrotask(() => {
      setReceiptImage(null);
      setReceiptImageUrl(initialExpense.receipturl);
    });
  }, [initialExpense, currentUserId, members, receiptImage]);

  useEffect(() => {
    const prune = (prev: Set<string>) => {
      const next = new Set(
        [...prev].filter(
          (id) =>
            members.some((m) => m.id === id) && !deselectedMembers.has(id),
        ),
      );
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) {
        return prev;
      }
      return next;
    };
    queueMicrotask(() => {
      setPercentageManualIds(prune);
    });
    queueMicrotask(() => {
      setExactManualIds(prune);
    });
  }, [deselectedMembers, members]);

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

  useEffect(() => {
    if (splitType !== "itemized") return;
    const selected = new Set(
      members.map((m) => m.id).filter((id) => !deselectedMembers.has(id)),
    );
    const fallback =
      effectiveSinglePayer != null && selected.has(effectiveSinglePayer)
        ? effectiveSinglePayer
        : members.find((m) => selected.has(m.id))?.id ?? null;
    if (fallback == null) return;


    queueMicrotask(() => {
      setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const filtered = item.assignedTo.filter((uid) => selected.has(uid));
        const nextAssign = filtered.length > 0 ? filtered : [fallback];
        const a = [...item.assignedTo].sort().join(",");
        const b = [...nextAssign].sort().join(",");
        if (a !== b) {
          changed = true;
          return { ...item, assignedTo: nextAssign };
        }
        return item;
      });
      return changed ? next : prev;
      });
    });
  }, [splitType, deselectedMembers, members, effectiveSinglePayer]);

  const fullMultiplePayers = useMemo(() => {
    const r: Record<string, string> = {};
    members.forEach((m) => {
      r[m.id] = multiplePayers[m.id] ?? "";
    });
    return r;
  }, [members, multiplePayers]);

  const itemsTotal = useMemo(
    () =>
      items.reduce((acc, i) => acc + moneyToCents(i.amount || 0) / 100, 0),
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
        // Default shares to 1 when missing so shares-split math matches inputs (value ?? 1 in UI).
        shares: current.shares ?? 1,
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
      const centsByUser: Record<string, number> = {};
      items.forEach((item) => {
        if (item.assignedTo.length === 0) return;
        const lineCents = moneyToCents(item.amount || 0);
        if (lineCents <= 0) return;
        const n = item.assignedTo.length;
        const base = Math.floor(lineCents / n);
        const remainder = lineCents - base * n;
        const ordered = [...item.assignedTo].sort((a, b) =>
          a.localeCompare(b),
        );
        ordered.forEach((uid, idx) => {
          const add = base + (idx < remainder ? 1 : 0);
          centsByUser[uid] = (centsByUser[uid] ?? 0) + add;
        });
      });
      members.forEach((m) => {
        const cur = next[m.id] ?? {
          user_id: m.id,
          amount_owed: 0,
          percentage: 0,
          shares: 1,
          adjustment: 0,
        };
        next[m.id] = {
          ...cur,
          amount_owed: (centsByUser[m.id] ?? 0) / 100,
        };
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
        (sum, id) => sum + (next[id]?.shares ?? 1),
        0,
      );
      selectedIds.forEach((id) => {
        const shares = next[id]?.shares ?? 1;
        const current = next[id]!;
        next[id] = {
          ...current,
          shares,
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
      const manual = selectedIds.filter((id) => percentageManualIds.has(id));
      const auto = selectedIds.filter((id) => !percentageManualIds.has(id));
      const sumManual = manual.reduce(
        (s, mid) => s + (next[mid]?.percentage ?? 0),
        0,
      );
      const remainder = 100 - sumManual;
      const autoPct =
        auto.length > 0 && remainder > 0 ? remainder / auto.length : 0;

      selectedIds.forEach((id) => {
        const current = next[id]!;
        const pct = percentageManualIds.has(id)
          ? (current.percentage ?? 0)
          : auto.length > 0
            ? autoPct
            : (current.percentage ?? 0);
        next[id] = {
          ...current,
          percentage: pct,
          amount_owed: (pct / 100) * total,
        };
      });
    } else if (splitType === "exact") {
      const manual = selectedIds.filter((id) => exactManualIds.has(id));
      const auto = selectedIds.filter((id) => !exactManualIds.has(id));
      const sumManualCents = manual.reduce(
        (s, mid) => s + moneyToCents(next[mid]?.amount_owed ?? 0),
        0,
      );
      const totalCents = moneyToCents(total);
      const remainderCents = totalCents - sumManualCents;
      const autoCentsById: Record<string, number> = {};
      if (auto.length > 0 && remainderCents > 0) {
        const n = auto.length;
        const base = Math.floor(remainderCents / n);
        const extra = remainderCents - base * n;
        [...auto].sort((a, b) => a.localeCompare(b)).forEach((uid, idx) => {
          autoCentsById[uid] = base + (idx < extra ? 1 : 0);
        });
      } else if (auto.length > 0) {
        for (const uid of auto) autoCentsById[uid] = 0;
      }

      selectedIds.forEach((id) => {
        const current = next[id]!;
        const cents = exactManualIds.has(id)
          ? moneyToCents(current.amount_owed ?? 0)
          : auto.length > 0
            ? (autoCentsById[id] ?? 0)
            : moneyToCents(current.amount_owed ?? 0);
        next[id] = {
          ...current,
          amount_owed: cents / 100,
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
    percentageManualIds,
    exactManualIds,
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
    setPercentageManualIds(new Set());
    setExactManualIds(new Set());
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
    let defaultAssignees: string[] = [];
    if (effectiveSinglePayer != null) {
      defaultAssignees = [effectiveSinglePayer];
    } else if (selectedIds[0] != null) {
      defaultAssignees = [selectedIds[0]];
    } else if (members[0]?.id != null) {
      defaultAssignees = [members[0].id];
    }
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
        name: "",
        amount: 0,
        assignedTo: [],
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
      const out: Array<{ user_id?: string; email?: string; amount_owed: number }> =
        [];
      members.forEach((m) => {
        const owed = memberSplitsComputed[m.id]?.amount_owed ?? 0;
        if (owed <= 0) return;
        const isEmail = m.id.includes("@");
        out.push(
          isEmail
            ? { email: m.id.toLowerCase().trim(), amount_owed: owed }
            : { user_id: m.id, amount_owed: owed },
        );
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
      ...(splitType === "itemized" && {
        itemized: items.map(({ name, amount, assignedTo }) => ({
          name,
          amount,
          assignedTo,
        })),
      }),
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

    const lineitemsSnapshot =
      splitType === "itemized" && items.length > 0
        ? items.map((it) => ({
            id: it.id,
            name: it.name,
            amount: it.amount,
            assignedTo: [...it.assignedTo],
          }))
        : undefined;

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
      ...(lineitemsSnapshot != null ? { lineitems: lineitemsSnapshot } : {}),
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
      if (next.has(id)) {
        next.delete(id);
      } else {
        const selectedCount = members.filter((m) => !prev.has(m.id)).length;
        if (selectedCount <= 1) return prev;
        next.add(id);
      }
      return next;
    });
  }

  function selectAllSplitMembers() {
    setDeselectedMembers(new Set());
  }

  function keepOnlyPayerAsSplitMember() {
    const keep =
      effectiveSinglePayer != null &&
      members.some((m) => m.id === effectiveSinglePayer)
        ? effectiveSinglePayer
        : members[0]?.id ?? null;
    if (keep == null) return;
    setDeselectedMembers(
      new Set(members.map((m) => m.id).filter((mid) => mid !== keep)),
    );
  }

  function handleSplitValueChange(
    id: string,
    value: string,
    field: SplitValueField,
  ) {
    const numVal = parseFloat(value) || 0;
    if (field === "percentage" && splitType === "percentage") {
      setPercentageManualIds((s) => new Set(s).add(id));
    }
    if (field === "amount_owed" && splitType === "exact") {
      setExactManualIds((s) => new Set(s).add(id));
    }
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
              : (updated[mid]?.shares ?? prev[mid]?.shares ?? 1)),
          0,
        );
        selectedIds.forEach((mid) => {
          const shares =
            mid === id
              ? numVal
              : (updated[mid]?.shares ?? prev[mid]?.shares ?? 1);
          const current = updated[mid]!;
          updated[mid] = {
            ...current,
            amount_owed:
              totalShares > 0 ? (shares / totalShares) * total : 0,
          };
        });
      } else if (field === "percentage" && splitType === "percentage") {
        const current = updated[id]!;
        updated[id] = { ...current, percentage: numVal };
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
    selectAllSplitMembers,
    keepOnlyPayerAsSplitMember,
    handleSplitValueChange,
    handleMultiplePayerChange,
    clearReceipt,
  };
}
