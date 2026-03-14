"use client";

import { MemberStack } from "@/components/common/MemberStack";
import type { GroupDetailMember } from "@/features/groups/types";
import type { TransactionUser } from "../types";

interface AvatarStackProps {
  users: TransactionUser[];
  label: string;
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
      avatarurl: user.avatar,
    },
    email: null,
    invited_at: null,
  }));
}

export function AvatarStack({ users, label }: AvatarStackProps) {
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
    <div className="flex flex-col items-start gap-1">
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-300">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        <MemberStack members={members} size="small" max={3} />
      </div>
    </div>
  );
}
