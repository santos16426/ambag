"use client";

import { MemberStack } from "@/components/common/MemberStack";
import type { GroupDetailMember } from "@/features/groups/types";
import type { TransactionUser } from "../types";

interface AvatarStackProps {
  users: TransactionUser[];
  label: string;
  collect?: number | null;
  owed?: number | null;
}

function toMemberStackMembers(users: TransactionUser[]): GroupDetailMember[] {
  return users.map((user) => ({
    type: "member" as const,
    id: user.id,
    role: "",
    joined_at: null,
    user: {
      id: user.id,
      email: "",
      fullname: user.name,
      avatarurl: user.avatar ?? null,
    },
    email: null,
    invited_at: null,
  }));
}

export function AvatarStack({
  users,
  label,
  collect = null,
  owed = null,
}: AvatarStackProps) {
  const isOwed = typeof owed === "number" && owed > 0;
  const isCollect = typeof collect === "number" && collect > 0;
  if (!users.length) {
    return (
      <div className="flex flex-col items-start gap-1">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-300">
          {label}
        </span>
        <span className="text-[11px] text-slate-400">None</span>
      </div>
    );
  }

  const members = toMemberStackMembers(users);

  return (
    <div
      className={`flex flex-col ${isOwed && "items-end"} ${isCollect && "items-start"} gap-1`}
    >
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-300">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {isOwed && (
          <span className="text-[11px] font-semibold text-rose-500 whitespace-nowrap">
            You owe ₱
            {owed.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        )}
        <MemberStack
          members={members}
          size="small"
          max={3}
          noAvatarFallback="icon"
        />
        {isCollect && (
          <span className="text-[11px] font-semibold text-emerald-600 whitespace-nowrap">
            You collect ₱
            {collect.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </span>
        )}
      </div>
    </div>
  );
}
