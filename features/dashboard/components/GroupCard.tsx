import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Check, Copy, CreditCard, UserPlus, Mail } from "lucide-react";
import { useRouter } from "next/navigation";

import type { Group } from "../types";
import { useDashboardGroupsStore } from "../store/groups.store";

const GroupCard = ({ group }: { group: Group }) => {
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const activeGroupId = useDashboardGroupsStore((s) => s.activeGroupId);
  const setActiveGroup = useDashboardGroupsStore((s) => s.setActiveGroup);
  const handleCopy = (code: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const el = document.createElement("textarea");
    el.value = code;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    setCopyFeedback(code);
    setTimeout(() => setCopyFeedback(null), 2000);
  };
  const pendingRequests = group.pending_join_requests_count ?? 0;
  const pendingInvites = group.pending_invitations_count ?? 0;
  const hasPending = pendingRequests > 0 || pendingInvites > 0;
  const router = useRouter();
  return (
    <motion.div
      onClick={() => {
        setActiveGroup(group);
        // router.push(`/dashboard/${group.id}`);
      }}
      key={group.id}
      whileHover={{ y: -8 }}
      className="relative w-full group cursor-pointer"
    >
      <AnimatePresence>
        {activeGroupId === group.id && hasPending && (
          <motion.div
            initial={{ y: 0, opacity: 0 }}
            animate={{ y: -8, opacity: 1 }}
            className="absolute -top-4 left-6 right-6 z-20 flex gap-2"
          >
            {pendingRequests > 0 && (
              <div className="flex-1 bg-amber-400 text-amber-950 px-3 py-1.5 rounded-t-xl flex items-center justify-center gap-2 shadow-lg border-x border-t border-amber-500/50">
                <UserPlus className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {pendingRequests} Request{pendingRequests > 1 ? "s" : ""}
                </span>
              </div>
            )}
            {pendingInvites > 0 && (
              <div className="flex-1 bg-sky-400 text-sky-950 px-3 py-1.5 rounded-t-xl flex items-center justify-center gap-2 shadow-lg border-x border-t border-sky-500/50">
                <Mail className="w-3 h-3" />
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {pendingInvites} Invite{pendingInvites > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* The Credit Card Body */}
      <div className="relative z-21 h-full w-full rounded-[2.5rem] bg-slate-950 overflow-hidden shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] border border-white/10 flex flex-col justify-between transition-all group-hover:shadow-[0_40px_80px_-15px_rgba(107,33,168,0.25)]">
        {/* Visual Image Layer */}
        <div className="absolute inset-0 z-0">
          {group.image_url ? (
            <>
              <img
                src={group.image_url}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                alt={group.name}
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-slate-950/80" />
              <div className="absolute inset-0 backdrop-blur-[2px] bg-black/10 group-hover:backdrop-blur-none transition-all duration-500" />
            </>
          ) : (
            <div className="w-full h-full bg-linear-to-br from-slate-800 to-slate-950">
              <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
            </div>
          )}
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 p-8 space-y-4 h-full flex flex-col justify-between">
          {/* Card Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              {/* EMV Chip */}
              <div className="w-12 h-9 rounded-md bg-linear-to-br from-yellow-200 via-yellow-500 to-yellow-600 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-3 gap-px opacity-30">
                  <div className="border-r border-black/20" />
                  <div className="border-r border-black/20" />
                </div>
              </div>
            </div>

            {/* Role Indicator - Simplified */}
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 drop-shadow-md">
                {group.user_role === "admin" ? "Owner" : "Member"}
              </span>
              <CreditCard className="text-white/20 w-8 h-8" />
            </div>
          </div>

          {/* Card Middle: Group Name */}
          <div className="mt-2">
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tighter capitalize leading-none drop-shadow-2xl truncate">
              {group.name}
            </h2>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className="flex items-center gap-1 text-[10px] font-bold text-white/70 capitalize tracking-widest bg-black/20 backdrop-blur-md px-2 py-1 rounded-md border border-white/10">
                <Users className="w-3 h-3" /> {group.member_count} Members
              </div>
              {activeGroupId === group.id && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 capitalize tracking-widest">
                  <Check className="w-3 h-3" /> Active
                </div>
              )}
            </div>
          </div>

          {/* Card Footer: Data Points */}
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">
                Invite Code
              </p>
              <button
                onClick={(e) => handleCopy(group.invite_code ?? "", e)}
                className="flex items-center gap-2 font-mono text-lg font-bold text-white hover:text-purple-400 transition-colors drop-shadow-lg"
              >
                {copyFeedback === group.invite_code
                  ? "COPIED"
                  : group.invite_code}
                {copyFeedback !== group.invite_code && (
                  <Copy className="w-4 h-4 opacity-30" />
                )}
              </button>
            </div>

            <div className="text-right">
              <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.3em]">
                Total Ambag
              </p>
              <p className="text-2xl font-black text-white tracking-tighter leading-none drop-shadow-lg">
                ₱{group.total_expenses?.toLocaleString() ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default GroupCard;
